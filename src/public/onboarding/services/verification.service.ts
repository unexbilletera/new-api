import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { OnboardingModel } from '../models/onboarding.model';
import { OnboardingMapper } from '../mappers/onboarding.mapper';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EmailService } from '../../../shared/email/email.service';
import { SmsService } from '../../../shared/sms/sms.service';
import { VerifyOnboardingCodeDto } from '../dto/onboarding.dto';

@Injectable()
export class VerificationService {
  constructor(
    private onboardingModel: OnboardingModel,
    private onboardingMapper: OnboardingMapper,
    private logger: LoggerService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private normalizePhone(phone?: string): string | undefined {
    return phone ? phone.replace(/\D/g, '') : undefined;
  }

  async verifyOnboardingCode(dto: VerifyOnboardingCodeDto) {
    this.logger.info('[ONBOARDING] Verifying code', {
      type: dto.type,
      email: dto.email ? this.normalizeEmail(dto.email) : undefined,
      phone: dto.phone ? this.normalizePhone(dto.phone) : undefined,
    });

    if (!dto.code || !dto.type) {
      throw new BadRequestException('users.errors.codeAndTypeRequired');
    }

    const email = dto.email ? this.normalizeEmail(dto.email) : undefined;
    const phone = dto.phone ? this.normalizePhone(dto.phone) : undefined;

    if (dto.type === 'email' && !email) {
      throw new BadRequestException('users.errors.emailRequired');
    }

    if (dto.type === 'phone' && !phone) {
      throw new BadRequestException('users.errors.phoneRequired');
    }

    let user;
    if (dto.type === 'email') {
      user = await this.onboardingModel.findUserByEmail(email!);
    } else {
      user = await this.onboardingModel.findUserByPhone(phone!);
    }

    if (!user) {
      this.logger.warn('[ONBOARDING] User not found for code verification', {
        type: dto.type,
        email,
        phone,
      });
      throw new NotFoundException('users.errors.userNotFound');
    }

    const onboardingState = (user.onboardingState as any) || {
      completedSteps: [],
      needsCorrection: [],
    };

    if (dto.type === 'email') {
      return await this.verifyEmailCode(
        user,
        email!,
        dto.code,
        onboardingState,
      );
    } else {
      return await this.verifyPhoneCode(
        user,
        phone!,
        dto.code,
        onboardingState,
      );
    }
  }

  private async verifyEmailCode(
    user: any,
    email: string,
    code: string,
    onboardingState: any,
  ) {
    try {
      this.logger.info('[ONBOARDING] Verifying email code', {
        userId: user.id,
        email,
      });
      await this.emailService.verifyCode(email, code, true);

      if (!onboardingState.completedSteps.includes('1.2')) {
        onboardingState.completedSteps.push('1.2');
      }
      if (!onboardingState.completedSteps.includes('1.3')) {
        onboardingState.completedSteps.push('1.3');
      }

      const updated = await this.onboardingModel.updateUserOnboardingComplete(
        user.id,
        {
          onboardingState,
          emailVerifiedAt: new Date(),
        },
      );

      this.logger.info('[ONBOARDING] Email code verified successfully', {
        userId: user.id,
        completedSteps: onboardingState.completedSteps,
      });

      return this.onboardingMapper.toVerifyOnboardingCodeResponseDto(
        updated.id,
        updated.onboardingState,
        'phoneForm',
      );
    } catch (error) {
      this.logger.error(
        '[ONBOARDING] Email code verification failed',
        error instanceof Error
          ? error
          : new Error('Email code verification failed'),
        {
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );
      if (error instanceof Error) {
        if (
          error.message.includes('not found') ||
          error.message.includes('expired')
        ) {
          throw new BadRequestException('users.errors.codeNotFoundOrExpired');
        }
        if (error.message.includes('Invalid')) {
          throw new BadRequestException('users.errors.invalidCode');
        }
      }
      throw error;
    }
  }

  private async verifyPhoneCode(
    user: any,
    phone: string,
    code: string,
    onboardingState: any,
  ) {
    try {
      this.logger.info('[ONBOARDING] Verifying phone code', {
        userId: user.id,
        phone,
      });
      await this.smsService.verifyCode(phone, code);

      if (!onboardingState.completedSteps.includes('1.5')) {
        onboardingState.completedSteps.push('1.5');
      }
      if (!onboardingState.completedSteps.includes('1.6')) {
        onboardingState.completedSteps.push('1.6');
      }

      const updated = await this.onboardingModel.updateUserOnboardingComplete(
        user.id,
        {
          onboardingState,
          phoneVerifiedAt: new Date(),
        },
      );

      this.logger.info('[ONBOARDING] Phone code verified successfully', {
        userId: user.id,
        completedSteps: onboardingState.completedSteps,
      });

      return this.onboardingMapper.toVerifyOnboardingCodeResponseDto(
        updated.id,
        updated.onboardingState,
        'passwordForm',
      );
    } catch (error) {
      this.logger.error(
        '[ONBOARDING] Phone code verification failed',
        error instanceof Error
          ? error
          : new Error('Phone code verification failed'),
        {
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );
      if (error instanceof Error) {
        if (
          error.message.includes('not found') ||
          error.message.includes('expired')
        ) {
          throw new BadRequestException('users.errors.codeNotFoundOrExpired');
        }
        if (error.message.includes('Invalid')) {
          throw new BadRequestException('users.errors.invalidCode');
        }
      }
      throw error;
    }
  }
}
