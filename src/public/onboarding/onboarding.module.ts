import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { EmailModule } from '../../shared/email/email.module';
import { SmsModule } from '../../shared/sms/sms.module';
import { NotificationsModule } from '../../shared/notifications/notifications.module';
import { LoggerModule } from '../../shared/logger/logger.module';
import { AppConfigModule } from '../../shared/config/config.module';
import { ValidaModule } from '../../shared/valida/valida.module';
import { OnboardingController } from './controllers/onboarding.controller';
import { OnboardingService } from './services/onboarding.service';
import { AuthService } from '../auth/services/auth.service';
import { PublicAuthModule } from '../auth/auth.module';

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
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class PublicOnboardingModule {}

