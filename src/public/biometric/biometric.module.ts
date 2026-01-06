import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';
import { NotificationsModule } from '../../shared/notifications/notifications.module';
import { SmsModule } from '../../shared/sms/sms.module';
import { BiometricController } from './controllers/biometric.controller';
import { BiometricService } from './services/biometric.service';

@Module({
  imports: [PrismaModule, JwtModule, NotificationsModule, SmsModule],
  controllers: [BiometricController],
  providers: [BiometricService],
  exports: [BiometricService],
})
export class BiometricModule {}
