import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { OnboardingModel } from '../models/onboarding.model';
import { OnboardingMapper } from '../mappers/onboarding.mapper';
import { LoggerService } from '../../../shared/logger/logger.service';
import { NotificationService } from '../../../shared/notifications/notifications.service';
import { RenaperService } from '../../../shared/renaper/renaper.service';
import { Pdf417ParserService } from '../../../shared/renaper/pdf417-parser.service';
import { S3Service } from '../../../shared/storage/s3.service';
import {
  StartIdentityOnboardingDto,
  UpdateIdentityOnboardingDto,
  UploadArgentinaDocumentDto,
} from '../dto/onboarding.dto';

@Injectable()
export class IdentityOnboardingService {
  constructor(
    private onboardingModel: OnboardingModel,
    private onboardingMapper: OnboardingMapper,
    private logger: LoggerService,
    private notificationService: NotificationService,
    private renaperService: RenaperService,
    private pdf417Parser: Pdf417ParserService,
    private s3Service: S3Service,
  ) {}

  async startIdentityOnboarding(
    userId: string,
    dto: StartIdentityOnboardingDto,
  ) {
    const user = await this.onboardingModel.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const country = (dto.country || dto.countryCode || 'br').toLowerCase() as
      | 'ar'
      | 'br';

    const existingIdentity =
      await this.onboardingModel.findIdentityByUserAndCountry(userId, country);
    if (existingIdentity) {
      return this.onboardingMapper.toStartIdentityOnboardingResponseDto(
        existingIdentity.id,
      );
    }

    const identity = await this.onboardingModel.createIdentity({
      userId,
      country: country as 'ar' | 'br',
      status: 'pending',
    });

    try {
      const defaultProfile =
        await this.onboardingModel.findDefaultSpendingLimitProfile();
      if (defaultProfile?.id) {
        await this.onboardingModel.createUserIdentitySpendingLimit({
          userIdentityId: identity.id,
          profileId: defaultProfile.id,
        });
      }
    } catch (error) {
      this.logger.warn('[onboarding] skipping spending limit creation', {
        error: error?.message || error,
      });
    }

    return this.onboardingMapper.toStartIdentityOnboardingResponseDto(
      identity.id,
    );
  }

  async updateIdentityOnboarding(
    identityId: string,
    dto: UpdateIdentityOnboardingDto,
  ) {
    const identity = await this.onboardingModel.findIdentityById(identityId);
    if (!identity) {
      throw new NotFoundException('Identity not found');
    }

    const updates: any = {};
    const onboardingState = identity.users_usersIdentities_userIdTousers
      ?.onboardingState || {
      completedSteps: [],
      needsCorrection: [],
    };

    if (dto.documentNumber) {
      updates.identityDocumentNumber = dto.documentNumber;
      updates.taxDocumentNumber = dto.documentNumber;
    }
    if (dto.documentIssuer) {
      updates.identityDocumentIssuer = dto.documentIssuer;
    }
    if (dto.documentExpiration) {
      updates.identityDocumentIssueDate = new Date(dto.documentExpiration);
    }
    if (dto.biometricData) {
      updates.notes = JSON.stringify(dto.biometricData);
    }

    const state = onboardingState as any;
    if (!state.completedSteps || !Array.isArray(state.completedSteps)) {
      state.completedSteps = [];
    }
    if (!state.completedSteps.includes('2.2')) {
      state.completedSteps.push('2.2');
    }

    await this.onboardingModel.updateIdentity(identityId, updates);
    await this.onboardingModel.updateUserOnboardingComplete(identity.userId, {
      onboardingState,
    });

    return this.onboardingMapper.toUpdateIdentityOnboardingResponseDto(
      identityId,
    );
  }

  async uploadArgentinaDocument(
    userId: string,
    identityId: string,
    dto: UploadArgentinaDocumentDto,
  ) {
    const user = await this.onboardingModel.findUserById(userId);
    const identity = await this.onboardingModel.findIdentityById(identityId);

    if (!user || !identity) {
      throw new NotFoundException('User or identity not found');
    }

    if (identity.country !== 'ar') {
      throw new BadRequestException(
        'This endpoint is only for Argentine documents',
      );
    }

    if (!dto.frontImage || !dto.backImage) {
      throw new BadRequestException('Front and back images are required');
    }

    if (!dto.pdf417Data) {
      throw new BadRequestException('PDF417 data is required');
    }

    const { documentNumber, gender, dateOfBirth, firstName, lastName } =
      dto.pdf417Data;
    if (!documentNumber || !gender || !dateOfBirth || !firstName || !lastName) {
      throw new BadRequestException(
        'PDF417 data incomplete (documentNumber, gender, dateOfBirth, firstName, lastName are required)',
      );
    }

    let renaperValidation;
    try {
      renaperValidation = await this.renaperService.validateDocument({
        documentNumber,
        gender,
        tramite: dto.pdf417Data.documentExpiration || '',
        userId: user.id,
        userImage: user.image || undefined,
      });
      this.logger.info(`RENAPER validation: ${renaperValidation.message}`);
    } catch (renaperError: any) {
      this.logger.error('RENAPER validation failed', renaperError);

      const isForbiddenError =
        renaperError.isForbidden ||
        renaperError.code === 'RENAPER_FORBIDDEN' ||
        renaperError.response?.status === 403 ||
        renaperError.message?.includes('IP não autorizado');

      if (isForbiddenError) {
        this.logger.error('Error 403: IP not on RENAPER API whitelist');
        throw new ServiceUnavailableException({
          success: false,
          error: 'Serviço de validação temporariamente indisponível',
          message:
            'O serviço de validação de documentos está temporariamente indisponível. Por favor, tente novamente mais tarde.',
          details: {
            code: 'RENAPER_FORBIDDEN',
            type: 'infrastructure_error',
            error: 'IP não autorizado na API RENAPER',
          },
        });
      }

      throw new BadRequestException({
        success: false,
        error: renaperError.message || 'Documento inválido',
        details: {
          code: renaperError.code || renaperError.response?.status,
          error: renaperError.error || renaperError.response?.data,
        },
      });
    }

    if (!renaperValidation.success) {
      throw new BadRequestException({
        success: false,
        error: renaperValidation.message || 'Invalid document',
      });
    }

    this.logger.info('Uploading images to S3...');

    const frontFileName = `${identityId}_dni_front.jpg`;
    const backFileName = `${identityId}_dni_back.jpg`;

    let frontImageUrl: string;
    let backImageUrl: string;

    try {
      frontImageUrl = await this.s3Service.uploadBase64({
        base64: dto.frontImage,
        name: frontFileName,
      });
      this.logger.info(`Front image uploaded: ${frontImageUrl}`);

      backImageUrl = await this.s3Service.uploadBase64({
        base64: dto.backImage,
        name: backFileName,
      });
      this.logger.info(`Back image uploaded: ${backImageUrl}`);
    } catch (uploadError) {
      this.logger.error('S3 upload error', uploadError);
      throw new BadRequestException('Failed to upload images');
    }

    const formattedFirstName =
      firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    const formattedLastName =
      lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
    const formattedFullName =
      `${formattedFirstName} ${formattedLastName}`.trim();

    const userUpdates: any = {
      firstName: formattedFirstName,
      lastName: formattedLastName,
      name: formattedFullName,
      gender: gender.toLowerCase() === 'm' ? 'male' : 'female',
      birthdate: new Date(dateOfBirth),
    };

    if (!user.username) {
      userUpdates.username = formattedFirstName;
    }

    if (!user.country) {
      userUpdates.country = 'ar';
    }

    const onboardingState = (user.onboardingState as any) || {
      completedSteps: [],
      needsCorrection: [],
    };
    const state = onboardingState as any;
    if (!state.completedSteps || !Array.isArray(state.completedSteps)) {
      state.completedSteps = [];
    }

    if (!state.completedSteps.includes('2.2')) {
      state.completedSteps.push('2.2');
    }

    if (!state.completedSteps.includes('documentVerificationSuccess.ar')) {
      state.completedSteps.push('documentVerificationSuccess.ar');
    }

    userUpdates.onboardingState = onboardingState;

    await this.onboardingModel.updateIdentity(identityId, {
      name: formattedFullName,
      identityDocumentType: 'dni',
      identityDocumentNumber: documentNumber,
      identityDocumentIssueDate: new Date(
        dto.pdf417Data.documentExpiration || dateOfBirth,
      ),
      identityDocumentIssuer: dto.pdf417Data.documentExpiration || '',
      identityDocumentFrontImage: frontImageUrl,
      identityDocumentBackImage: backImageUrl,
      identityDocumentImageType: 'dni',
    });

    await this.onboardingModel.updateUserOnboardingComplete(
      userId,
      userUpdates,
    );

    if (user.email) {
      await this.notificationService.sendEmail({
        to: user.email,
        subject: 'Documento recebido',
        text: 'We received your Argentine document for validation.',
      });
    }

    return this.onboardingMapper.toUploadArgentinaDocumentResponseDto(
      onboardingState,
    );
  }

  async getOnboardingPendingData(userIdentityId: string) {
    const identity =
      await this.onboardingModel.getOnboardingPendingData(userIdentityId);

    const state = (identity.users_usersIdentities_userIdTousers
      ?.onboardingState as any) || {
      completedSteps: [],
      needsCorrection: [],
    };
    const requiredSteps =
      identity.country === 'ar'
        ? ['2.1', '2.2', '2.3', '2.4']
        : ['3.1', '3.2', '3.3', '3.4', '3.5'];

    const pendingSteps = requiredSteps.filter(
      (step) => !state.completedSteps?.includes(step),
    );
    return this.onboardingMapper.toOnboardingPendingDataResponseDto(
      pendingSteps,
      state.needsCorrection || [],
    );
  }

  async getOnboardingStatus(userIdentityId: string) {
    const identity =
      await this.onboardingModel.getOnboardingStatus(userIdentityId);

    const state = (identity.users_usersIdentities_userIdTousers
      ?.onboardingState as any) || { completedSteps: [] };
    const requiredSteps =
      identity.country === 'ar'
        ? ['2.1', '2.2', '2.3', '2.4']
        : ['3.1', '3.2', '3.3', '3.4', '3.5'];

    return this.onboardingMapper.toOnboardingStatusResponseDto(
      requiredSteps,
      state.completedSteps || [],
    );
  }

  async validateOnboardingData(userIdentityId: string) {
    const identity =
      await this.onboardingModel.validateOnboardingData(userIdentityId);

    const errors = [] as string[];
    if (!identity.identityDocumentNumber) errors.push('identityDocumentNumber');
    if (!identity.identityDocumentFrontImage)
      errors.push('identityDocumentFrontImage');
    if (!identity.identityDocumentBackImage)
      errors.push('identityDocumentBackImage');

    return this.onboardingMapper.toValidateOnboardingDataResponseDto(errors);
  }

  async retryOnboarding(userIdentityId: string) {
    await this.onboardingModel.retryOnboarding(userIdentityId);
    return this.onboardingMapper.toRetryOnboardingResponseDto();
  }

  async updateOnboardingSpecificData(
    userIdentityId: string,
    fieldUpdates: any,
  ) {
    await this.onboardingModel.updateIdentity(userIdentityId, fieldUpdates);
    return { message: 'Onboarding data updated' };
  }
}
