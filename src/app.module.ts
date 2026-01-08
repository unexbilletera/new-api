import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app/services/app.service';
import { AppModel } from './app/models/app.model';
import { AppMapper } from './app/mappers/app.mapper';
import { PrismaModule } from './shared/prisma/prisma.module';
import { JwtModule } from './shared/jwt/jwt.module';
import { ConfigModule } from './shared/config/config.module';
import { LoggerModule } from './shared/logger/logger.module';
import { SqsModule } from './shared/sqs/sqs.module';

import { PublicAuthModule } from './public/auth/auth.module';
import { PublicOnboardingModule } from './public/onboarding/onboarding.module';
import { PublicUsersModule } from './public/users/users.module';
import { BiometricModule } from './public/biometric/biometric.module';

import { SecureTransactionsModule } from './secure/transactions/transactions.module';
import { SecureExchangeModule } from './secure/exchange/exchange.module';
import { SecureLedgerModule } from './secure/ledger/ledger.module';
import { SecureTreasuryModule } from './secure/treasury/treasury.module';
import { SecureNotificationsModule } from './secure/notifications/notifications.module';
import { ActionsAppModule } from './secure/actions-app/actions-app.module';
import { AppInfoModule } from './secure/app-info/app-info.module';
import { CampaignsModule } from './secure/campaigns/campaigns.module';
import { TermsModule } from './secure/terms/terms.module';

import { BackofficeAuthModule } from './backoffice/auth/auth.module';
import { BackofficeClientsModule } from './backoffice/clients/backoffice-clients.module';
import { BackofficeUsersModule } from './backoffice/users/backoffice-users.module';
import { BackofficeOnboardingModule } from './backoffice/onboarding/backoffice-onboarding.module';
import { BackofficeActionsModule } from './backoffice/actions/backoffice-actions.module';
import { BackofficeSystemConfigModule } from './backoffice/system-config/backoffice-system-config.module';
import { BackofficeRolesModule } from './backoffice/roles/backoffice-roles.module';

import { WebhooksModule } from './webhooks/webhooks.module';

import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    SqsModule,
    PrismaModule,
    JwtModule,
    HealthModule,
    PublicAuthModule,
    PublicOnboardingModule,
    PublicUsersModule,
    BiometricModule,
    SecureTransactionsModule,
    SecureExchangeModule,
    SecureLedgerModule,
    SecureTreasuryModule,
    SecureNotificationsModule,
    ActionsAppModule,
    AppInfoModule,
    CampaignsModule,
    TermsModule,
    BackofficeAuthModule,
    BackofficeClientsModule,
    BackofficeUsersModule,
    BackofficeOnboardingModule,
    BackofficeActionsModule,
    BackofficeSystemConfigModule,
    BackofficeRolesModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppModel, AppMapper],
})
export class AppModule {}
