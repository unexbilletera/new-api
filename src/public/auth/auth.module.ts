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
import { TestAuthController } from './controllers/test-auth.controller';
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
import { BruteForceService } from '../../shared/security/brute-force.service';
import { RateLimiterService } from '../../shared/security/rate-limiter.service';
import { SuspiciousActivityService } from '../../shared/security/suspicious-activity.service';

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
  controllers: [AuthController, TestAuthController],
  providers: [
    AuthUserModel,
    ValidationCodeModel,
    AuthMapper,
    SignupService,
    SigninService,
    EmailValidationService,
    PhoneValidationService,
    PasswordRecoveryService,
    TokenService,
    AuthService,
    BruteForceService,
    RateLimiterService,
    SuspiciousActivityService,
  ],
  exports: [
    AuthService,
    SignupService,
    SigninService,
    EmailValidationService,
    PhoneValidationService,
    PasswordRecoveryService,
    TokenService,
  ],
})
export class PublicAuthModule {}
