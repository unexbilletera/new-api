import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { ExchangeModule } from '../../shared/exchange/exchange.module';
import { LoggerModule } from '../../shared/logger/logger.module';
import { AppConfigModule } from '../../shared/config/config.module';
import { ValidaModule } from '../../shared/valida/valida.module';
import { JwtModule } from '../../shared/jwt/jwt.module';
import { AccessLogModule } from '../../shared/access-log/access-log.module';
import { EmailModule } from '../../shared/email/email.module';
import { SystemVersionService } from '../../shared/helpers/system-version.service';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { UserModel } from './models/user.model';
import { IdentityModel } from './models/identity.model';
import { AccountModel } from './models/account.model';
import { UserMapper } from './mappers/user.mapper';
import { UserProfileService } from './services/user-profile.service';
import { EmailChangeService } from './services/email-change.service';
import { PasswordService } from './services/password.service';
import { SessionService } from './services/session.service';
import { AccountClosureService } from './services/account-closure.service';
import { LivenessService } from './services/liveness.service';
import { IdentityService } from './services/identity.service';
import { AccountService } from './services/account.service';
import { OnboardingStatusService } from './services/onboarding-status.service';
import { MessagingService } from './services/messaging.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    ExchangeModule,
    LoggerModule,
    AppConfigModule,
    ValidaModule,
    JwtModule,
    AccessLogModule,
    EmailModule,
  ],
  controllers: [UserController],
  providers: [
    UserModel,
    IdentityModel,
    AccountModel,
    UserMapper,
    UserProfileService,
    EmailChangeService,
    PasswordService,
    SessionService,
    AccountClosureService,
    LivenessService,
    IdentityService,
    AccountService,
    OnboardingStatusService,
    MessagingService,
    UserService,
    SystemVersionService,
  ],
  exports: [
    UserService,
    UserProfileService,
    EmailChangeService,
    PasswordService,
    SessionService,
    AccountClosureService,
    LivenessService,
    IdentityService,
    AccountService,
    OnboardingStatusService,
    MessagingService,
  ],
})
export class PublicUsersModule {}
