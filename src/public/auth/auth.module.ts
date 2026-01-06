import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { SmsModule } from '../../shared/sms/sms.module';
import { EmailModule } from '../../shared/email/email.module';
import { NotificationsModule } from '../../shared/notifications/notifications.module';
import { LoggerModule } from '../../shared/logger/logger.module';
import { JwtModule } from '../../shared/jwt/jwt.module';
import { AccessLogModule } from '../../shared/access-log/access-log.module';
import { CronosModule } from '../../shared/cronos/cronos.module';
import { ExchangeModule } from '../../shared/exchange/exchange.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';

@Module({
  imports: [
    PrismaModule,
    SmsModule,
    EmailModule,
    NotificationsModule,
    LoggerModule,
    JwtModule,
    AccessLogModule,
    CronosModule,
    ExchangeModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class PublicAuthModule {}

