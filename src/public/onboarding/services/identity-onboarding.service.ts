import { Injectable, NotFoundException } from '@nestjs/common';
import { OnboardingModel } from '../models/onboarding.model';
import { OnboardingMapper } from '../mappers/onboarding.mapper';
import { LoggerService } from '../../../shared/logger/logger.service';
import { NotificationService } from '../../../shared/notifications/notifications.service';
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
  ) {}

  async startIdentityOnboarding(userId: string, dto: StartIdentityOnboardingDto) {
    const user = await this.onboardingModel.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const country = (dto.country || dto.countryCode || 'br').toLowerCase();

    const existingIdentity = await this.onboardingModel.findIdentityByUserAndCountry(userId, country);
    if (existingIdentity) {
      return this.onboardingMapper.toStartIdentityOnboardingResponseDto(existingIdentity.id);
    }

    const identity = await this.onboardingModel.createIdentity({
      userId,
      country,
      status: 'pending',
    });

    try {
      const defaultProfile = await this.onboardingModel.findDefaultSpendingLimitProfile();
      if (defaultProfile?.id) {
        await this.onboardingModel.createUserIdentitySpendingLimit({
          userIdentityId: identity.id,
          profileId: defaultProfile.id,
        });
      }
    } catch (error) {
      this.logger.warn('[onboarding] skipping spending limit creation', { error: error?.message || error });
    }

    return this.onboardingMapper.toStartIdentityOnboardingResponseDto(identity.id);
  }

  async updateIdentityOnboarding(identityId: string, dto: UpdateIdentityOnboardingDto) {
    const identity = await this.onboardingModel.findIdentityById(identityId);
    if (!identity) {
      throw new NotFoundException('Identity not found');
    }

    const updates: any = {};
    const onboardingState = identity.users_usersIdentities_userIdTousers?.onboardingState || {
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

    if (!onboardingState.completedSteps.includes('2.2')) {
      onboardingState.completedSteps.push('2.2');
    }

    await this.onboardingModel.updateIdentity(identityId, updates);
    await this.onboardingModel.updateUserOnboardingComplete(identity.userId, {
      onboardingState,
    });

    return this.onboardingMapper.toUpdateIdentityOnboardingResponseDto(identityId);
  }

  async uploadArgentinaDocument(userId: string, identityId: string, dto: UploadArgentinaDocumentDto) {
    const user = await this.onboardingModel.findUserById(userId);
    const identity = await this.onboardingModel.findIdentityById(identityId);

    if (!user || !identity) {
      throw new NotFoundException('User or identity not found');
    }

    const onboardingState = user.onboardingState || { completedSteps: [], needsCorrection: [] };

    await this.onboardingModel.updateIdentity(identityId, {
      identityDocumentFrontImage: dto.frontImage,
      identityDocumentBackImage: dto.backImage,
      identityDocumentType: 'dni',
      identityDocumentNumber: dto.pdf417Data?.documentNumber,
      identityDocumentIssueDate: dto.pdf417Data?.dateOfBirth
        ? new Date(dto.pdf417Data.dateOfBirth)
        : identity.identityDocumentIssueDate,
    });

    const userUpdates: any = {};
    if (dto.pdf417Data?.firstName) userUpdates.firstName = dto.pdf417Data.firstName;
    if (dto.pdf417Data?.lastName) userUpdates.lastName = dto.pdf417Data.lastName;
    if (dto.pdf417Data?.dateOfBirth) userUpdates.birthdate = new Date(dto.pdf417Data.dateOfBirth);
    if (dto.pdf417Data?.gender)
      userUpdates.gender = dto.pdf417Data.gender.toLowerCase() === 'm' ? 'male' : 'female';

    if (!onboardingState.completedSteps.includes('2.2')) onboardingState.completedSteps.push('2.2');
    if (!onboardingState.completedSteps.includes('documentVerificationSuccess.ar'))
      onboardingState.completedSteps.push('documentVerificationSuccess.ar');

    userUpdates.onboardingState = onboardingState;

    await this.onboardingModel.updateUserOnboardingComplete(userId, userUpdates);

    if (user.email) {
      await this.notificationService.sendEmail({
        to: user.email,
        subject: 'Documento recebido',
        text: 'Recebemos seu documento argentino para validação.',
      });
    }

    return this.onboardingMapper.toUploadArgentinaDocumentResponseDto(onboardingState);
  }

  async getOnboardingPendingData(userIdentityId: string) {
    const identity = await this.onboardingModel.getOnboardingPendingData(userIdentityId);

    const state = identity.users_usersIdentities_userIdTousers?.onboardingState || {
      completedSteps: [],
      needsCorrection: [],
    };
    const requiredSteps =
      identity.country === 'ar' ? ['2.1', '2.2', '2.3', '2.4'] : ['3.1', '3.2', '3.3', '3.4', '3.5'];

    const pendingSteps = requiredSteps.filter((step) => !state.completedSteps?.includes(step));
    return this.onboardingMapper.toOnboardingPendingDataResponseDto(pendingSteps, state.needsCorrection || []);
  }

  async getOnboardingStatus(userIdentityId: string) {
    const identity = await this.onboardingModel.getOnboardingStatus(userIdentityId);

    const state = identity.users_usersIdentities_userIdTousers?.onboardingState || { completedSteps: [] };
    const requiredSteps =
      identity.country === 'ar' ? ['2.1', '2.2', '2.3', '2.4'] : ['3.1', '3.2', '3.3', '3.4', '3.5'];

    return this.onboardingMapper.toOnboardingStatusResponseDto(requiredSteps, state.completedSteps || []);
  }

  async validateOnboardingData(userIdentityId: string) {
    const identity = await this.onboardingModel.validateOnboardingData(userIdentityId);

    const errors = [] as string[];
    if (!identity.identityDocumentNumber) errors.push('identityDocumentNumber');
    if (!identity.identityDocumentFrontImage) errors.push('identityDocumentFrontImage');
    if (!identity.identityDocumentBackImage) errors.push('identityDocumentBackImage');

    return this.onboardingMapper.toValidateOnboardingDataResponseDto(errors);
  }

  async retryOnboarding(userIdentityId: string) {
    await this.onboardingModel.retryOnboarding(userIdentityId);
    return this.onboardingMapper.toRetryOnboardingResponseDto();
  }

  async updateOnboardingSpecificData(userIdentityId: string, fieldUpdates: any) {
    await this.onboardingModel.updateIdentity(userIdentityId, fieldUpdates);
    return { message: 'Onboarding data updated' };
  }
}
