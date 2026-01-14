import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { OnboardingModel } from '../models/onboarding.model';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EmailService } from '../../../shared/email/email.service';
import { SendEmailValidationDto } from '../../auth/dto/email-validation.dto';

@Injectable()
export class EmailValidationOnboardingService {
  constructor(
    private onboardingModel: OnboardingModel,
    private emailService: EmailService,
    private logger: LoggerService,
  ) {}

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  async sendEmailValidation(dto: SendEmailValidationDto) {
    const email = this.normalizeEmail(dto.email);

    const user = await this.onboardingModel.findUserByEmail(email);
    if (!user) {
      this.logger.warn('[ONBOARDING] User not found for email validation', {
        email,
      });
      throw new NotFoundException('users.errors.userNotFound');
    }

    const onboardingState = (user.onboardingState as any) || {
      completedSteps: [],
      needsCorrection: [],
    };

    const completedSteps = onboardingState.completedSteps || [];

    if (!completedSteps.includes('1.1')) {
      this.logger.warn(
        '[ONBOARDING] User has not started onboarding (missing step 1.1)',
        {
          email,
          userId: user.id,
          completedSteps,
        },
      );
      throw new BadRequestException('users.errors.invalidParameters');
    }

    if (completedSteps.includes('1.2') && completedSteps.includes('1.3')) {
      this.logger.warn(
        '[ONBOARDING] User has already validated email (steps 1.2 and 1.3 completed)',
        {
          email,
          userId: user.id,
          completedSteps,
        },
      );
      throw new BadRequestException('users.errors.invalidParameters');
    }

    const result = await this.emailService.sendValidationCode(
      email,
      8,
      5,
      true,
    );

    this.logger.info('[ONBOARDING] Email validation code sent', {
      email,
      userId: user.id,
    });

    return {
      message: result.message,
    };
  }
}
