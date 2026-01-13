import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { OnboardingModel } from '../models/onboarding.model';
import { OnboardingMapper } from '../mappers/onboarding.mapper';
import { PasswordHelper } from '../../../shared/helpers/password.helper';
import { LoggerService } from '../../../shared/logger/logger.service';
import { NotificationService } from '../../../shared/notifications/notifications.service';
import { AppConfigService } from '../../../shared/config/config.service';
import {
  StartUserOnboardingDto,
  UpdateUserOnboardingDto,
} from '../dto/onboarding.dto';

@Injectable()
export class UserOnboardingService {
  constructor(
    private onboardingModel: OnboardingModel,
    private onboardingMapper: OnboardingMapper,
    private logger: LoggerService,
    private notificationService: NotificationService,
    private appConfigService: AppConfigService,
  ) {}

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private normalizePhone(phone?: string): string | undefined {
    return phone ? phone.replace(/\D/g, '') : undefined;
  }

  async startUserOnboarding(dto: StartUserOnboardingDto) {
    this.logger.info('[ONBOARDING] Starting user onboarding', {
      email: dto.email,
    });

    const email = this.normalizeEmail(dto.email);

    const emailRegex =
      /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email)) {
      this.logger.warn('[ONBOARDING] Invalid email format', { email });
      throw new BadRequestException('users.errors.invalidEmail');
    }

    const existingUser = await this.onboardingModel.findUserByEmail(email);
    if (existingUser) {
      this.logger.warn('[ONBOARDING] Email already in use', {
        email,
        existingUserId: existingUser.id,
      });
      throw new ConflictException('users.errors.emailAlreadyInUse');
    }

    const onboardingState = {
      completedSteps: ['1.1'],
      needsCorrection: [],
    };

    const user = await this.onboardingModel.createUser({
      email,
      username: email.split('@')[0],
      status: 'pending',
      access: 'user',
      onboardingState,
    });

    this.logger.info('[ONBOARDING] User onboarding started successfully', {
      userId: user.id,
      email: user.email,
      completedSteps: onboardingState.completedSteps,
    });

    return this.onboardingMapper.toStartUserOnboardingResponseDto(
      user.id,
      onboardingState,
    );
  }

  async updateUserOnboarding(userId: string, dto: UpdateUserOnboardingDto) {
    this.logger.info('[ONBOARDING] Updating user onboarding data', {
      userId,
      fields: Object.keys(dto),
    });

    const user = await this.onboardingModel.findUserById(userId);
    if (!user) {
      this.logger.warn('[ONBOARDING] User not found', { userId });
      throw new Error('users.errors.userNotFound');
    }

    const currentState = (user.onboardingState as any) || {
      completedSteps: [],
      needsCorrection: [],
    };
    const dataToUpdate: any = {};
    let completedStep = '';

    if (dto.phone) {
      dataToUpdate.phone = this.normalizePhone(dto.phone);
      completedStep = '1.4';
    }

    if (dto.password) {
      dataToUpdate.password = await PasswordHelper.hash(dto.password);
      dataToUpdate.status = 'pending';
      dataToUpdate.passwordUpdatedAt = new Date();
      completedStep = '1.7';

      if (dto.campaignCode) {
        await this.processCampaignCode(userId, dto.campaignCode, user.id);
      }
    }

    if (dto.firstName || dto.lastName) {
      dataToUpdate.firstName = dto.firstName ?? user.firstName;
      dataToUpdate.lastName = dto.lastName ?? user.lastName;
      if (dto.firstName && dto.lastName) {
        dataToUpdate.name = `${dto.firstName} ${dto.lastName}`;
      } else if (dto.firstName) {
        dataToUpdate.name = dto.firstName;
      } else if (dto.lastName) {
        dataToUpdate.name = dto.lastName;
      }
      dataToUpdate.username = dto.firstName || user.username;
      completedStep = '1.8';
    }

    if (dto.country || dto.birthdate || dto.gender || dto.maritalStatus) {
      dataToUpdate.country = dto.country ?? user.country;
      dataToUpdate.birthdate = dto.birthdate
        ? new Date(dto.birthdate)
        : user.birthdate;
      dataToUpdate.gender = dto.gender ?? user.gender;
      dataToUpdate.maritalStatus = dto.maritalStatus ?? user.maritalStatus;
      completedStep = '1.9';
    }

    if (dto.pep || dto.pepSince) {
      dataToUpdate.pep = dto.pep ?? user.pep;
      dataToUpdate.pepSince = dto.pepSince
        ? new Date(dto.pepSince)
        : user.pepSince;
      completedStep = '1.10';
    }

    if (dto.livenessImage) {
      await this.processLivenessImage(
        userId,
        dto.livenessImage,
        user,
        currentState,
      );
      completedStep = '1.11';
    }

    if (completedStep && !currentState.completedSteps.includes(completedStep)) {
      currentState.completedSteps.push(completedStep);
    }

    const requiredUserSteps = [
      '1.1',
      '1.2',
      '1.3',
      '1.4',
      '1.5',
      '1.6',
      '1.7',
      '1.8',
      '1.9',
      '1.10',
      '1.11',
      '1.12',
    ];
    const allUserStepsCompleted = requiredUserSteps.every((step) =>
      currentState.completedSteps.includes(step),
    );

    if (
      allUserStepsCompleted &&
      !currentState.completedSteps.includes('1.13')
    ) {
      currentState.completedSteps.push('1.13');
      this.logger.info('[ONBOARDING] All user onboarding steps completed', {
        userId,
      });
    }

    dataToUpdate.onboardingState = currentState;

    const updated = await this.onboardingModel.updateUserOnboarding(
      userId,
      dataToUpdate,
    );

    this.logger.info('[ONBOARDING] User onboarding data updated successfully', {
      userId,
      completedStep,
      totalCompletedSteps: currentState.completedSteps.length,
    });

    return this.onboardingMapper.toUpdateUserOnboardingResponseDto(
      updated,
      updated.onboardingState,
    );
  }

  private async processCampaignCode(
    userId: string,
    campaignCode: string,
    userIdPrimary: string,
  ) {
    const now = new Date();
    const campaignCodeUpper = campaignCode.toUpperCase().trim();
    const campaign =
      await this.onboardingModel.findCampaignCode(campaignCodeUpper);

    if (campaign) {
      const validFromOk = !campaign.validFrom || campaign.validFrom <= now;
      const validToOk = !campaign.validTo || campaign.validTo >= now;
      if (validFromOk && validToOk) {
        const existingUserCode =
          await this.onboardingModel.findUserCampaignCode(userId);
        if (!existingUserCode) {
          await this.onboardingModel.createUserCampaignCode(
            userId,
            campaign.id,
            campaign.code,
          );
        }
      }
    }
  }

  private async processLivenessImage(
    userId: string,
    livenessImage: string,
    user: any,
    currentState: any,
  ) {
    this.logger.info('[ONBOARDING] Processing liveness verification', {
      userId,
    });

    const validaEnabled = this.appConfigService.isValidaEnabled();

    if (!validaEnabled) {
      this.logger.info(
        '[ONBOARDING] Using simple photo validation (Valida disabled)',
        { userId },
      );
      const dataToUpdate = {
        livenessImage,
        livenessVerifiedAt: new Date(),
      };

      if (!currentState.completedSteps.includes('1.11'))
        currentState.completedSteps.push('1.11');
      if (!currentState.completedSteps.includes('1.12'))
        currentState.completedSteps.push('1.12');

      if (user.email) {
        await this.notificationService.sendEmail({
          to: user.email,
          subject: 'Selfie recebida',
          text: 'We received your selfie for proof-of-life verification.',
        });
      }

      this.logger.info('[ONBOARDING] Simple liveness verification completed', {
        userId,
      });
    } else {
      this.logger.info(
        '[ONBOARDING] Valida enabled - liveness should be processed via /api/users/user/liveness',
        {
          userId,
        },
      );
    }
  }
}
