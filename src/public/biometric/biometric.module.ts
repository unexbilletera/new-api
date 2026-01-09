import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';
import { NotificationsModule } from '../../shared/notifications/notifications.module';
import { SmsModule } from '../../shared/sms/sms.module';
import { BiometricController } from './controllers/biometric.controller';
import { BiometricService } from './services/biometric.service';
import { DeviceModel } from './models/device.model';
import { BiometricMapper } from './mappers/biometric.mapper';
import { DeviceRegistrationService } from './services/device-registration.service';
import { ChallengeVerificationService } from './services/challenge-verification.service';
import { DeviceManagementService } from './services/device-management.service';

@Module({
  imports: [PrismaModule, JwtModule, NotificationsModule, SmsModule],
  controllers: [BiometricController],
  providers: [
    DeviceModel,
    BiometricMapper,
    DeviceRegistrationService,
    ChallengeVerificationService,
    DeviceManagementService,
    BiometricService,
  ],
  exports: [
    BiometricService,
    DeviceRegistrationService,
    ChallengeVerificationService,
    DeviceManagementService,
  ],
})
export class BiometricModule {}
