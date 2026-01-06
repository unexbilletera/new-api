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
import { HelpersModule } from '../../shared/helpers/helpers.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthUserModel } from './models/user.model';
import { ValidationCodeModel } from './models/validation-code.model';
import { SignupService } from './services/signup.service';
import { SigninService } from './services/signin.service';
import { EmailValidationService } from './services/email-validation.service';
import { PhoneValidationService } from './services/phone-validation.service';
import { PasswordRecoveryService } from './services/password-recovery.service';
import { TokenService } from './services/token.service';
import { AuthMapper } from './mappers/auth.mapper';

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
    HelpersModule,
  ],
  controllers: [AuthController],
  providers: [
    // Models
    AuthUserModel,
    ValidationCodeModel,
    // Mappers
    AuthMapper,
    // Services (split)
    SignupService,
    SigninService,
    EmailValidationService,
    PhoneValidationService,
    PasswordRecoveryService,
    TokenService,
    // Original service (for backwards compatibility, will be refactored)
    AuthService,
  ],
  exports: [AuthService, SignupService, SigninService, EmailValidationService, PhoneValidationService, PasswordRecoveryService, TokenService],
})
export class PublicAuthModule {}

