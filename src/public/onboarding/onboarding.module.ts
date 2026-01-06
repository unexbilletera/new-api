import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { EmailModule } from '../../shared/email/email.module';
import { SmsModule } from '../../shared/sms/sms.module';
import { NotificationsModule } from '../../shared/notifications/notifications.module';
import { LoggerModule } from '../../shared/logger/logger.module';
import { AppConfigModule } from '../../shared/config/config.module';
import { ValidaModule } from '../../shared/valida/valida.module';
import { OnboardingController, UserOnboardingController } from './controllers/onboarding.controller';
import { OnboardingService } from './services/onboarding.service';
import { AuthService } from '../auth/services/auth.service';
import { PublicAuthModule } from '../auth/auth.module';
import { OnboardingModel } from './models/onboarding.model';
import { OnboardingMapper } from './mappers/onboarding.mapper';
import { UserOnboardingService } from './services/user-onboarding.service';
import { VerificationService } from './services/verification.service';
import { IdentityOnboardingService } from './services/identity-onboarding.service';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    SmsModule,
    NotificationsModule,
    LoggerModule,
    AppConfigModule,
    ValidaModule,
    PublicAuthModule,
  ],
  controllers: [OnboardingController, UserOnboardingController],
  providers: [
    OnboardingModel,
    OnboardingMapper,
    UserOnboardingService,
    VerificationService,
    IdentityOnboardingService,
    OnboardingService,
  ],
  exports: [
    OnboardingService,
    UserOnboardingService,
    VerificationService,
    IdentityOnboardingService,
  ],
})
export class PublicOnboardingModule {}

