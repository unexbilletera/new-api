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
import { CronosModule } from './shared/cronos/cronos.module';
import { RenaperModule as SharedRenaperModule } from './shared/renaper/renaper.module';
import { BindModule } from './shared/bind/bind.module';
import { StorageModule } from './shared/storage/storage.module';
import { MantecaModule } from './shared/manteca/manteca.module';
import { SpendingLimitsModule } from './shared/spending-limits/spending-limits.module';
import { CursorPaginatorService } from './shared/pagination/cursor-paginator.service';
import { QueryHelpers } from './shared/database/query.helpers';
import { CrudModule } from './shared/crud/crud.module';

import { PublicAuthModule } from './public/auth/auth.module';
import { PublicOnboardingModule } from './public/onboarding/onboarding.module';
import { PublicUsersModule } from './public/users/users.module';
import { BiometricModule } from './public/biometric/biometric.module';
import { WebhooksModule } from './public/webhooks/webhooks.module';
import { ComplianceModule } from './public/compliance/compliance.module';

import { SecureTransactionsModule } from './secure/transactions/transactions.module';
import { SecureExchangeModule } from './secure/exchange/exchange.module';
import { SecureLedgerModule } from './secure/ledger/ledger.module';
import { SecureTreasuryModule } from './secure/treasury/treasury.module';
import { SecureNotificationsModule } from './secure/notifications/notifications.module';
import { SecureMantecaModule } from './secure/manteca/manteca.module';
import { SecureCronosModule } from './secure/cronos/cronos.module';
import { SecureGireModule } from './secure/gire/gire.module';
import { SecureCoelsaModule } from './secure/coelsa/coelsa.module';
import { SecureBindModule } from './secure/bind/bind.module';
import { ActionsAppModule } from './secure/actions-app/actions-app.module';
import { AppInfoModule } from './secure/app-info/app-info.module';
import { CampaignsModule } from './secure/campaigns/campaigns.module';
import { TermsModule } from './secure/terms/terms.module';

// New modules
import { CardsModule } from './secure/cards/cards.module';
import { CreditsModule } from './secure/credits/credits.module';
import { ContactsModule } from './secure/contacts/contacts.module';
import { StoresModule } from './secure/stores/stores.module';
import { CategoriesModule } from './secure/categories/categories.module';
import { BenefitsModule } from './secure/benefits/benefits.module';
import { BranchesModule } from './secure/branches/branches.module';
import { SailpointsModule } from './secure/sailpoints/sailpoints.module';
import { RenaperModule } from './secure/renaper/renaper.module';
import { MicronautaModule } from './secure/micronauta/micronauta.module';
import { ValidaModule } from './secure/valida/valida.module';
import { AccreditationsModule } from './secure/accreditations/accreditations.module';
import { SandboxModule } from './secure/sandbox/sandbox.module';
import { TasksModule } from './secure/tasks/tasks.module';
import { PushModule } from './secure/push/push.module';
import { UsersDataModule } from './secure/users-data/users-data.module';

import { BackofficeAuthModule } from './backoffice/auth/auth.module';
import { BackofficeClientsModule } from './backoffice/clients/backoffice-clients.module';
import { BackofficeUsersModule } from './backoffice/users/backoffice-users.module';
import { BackofficeOnboardingModule } from './backoffice/onboarding/backoffice-onboarding.module';
import { BackofficeActionsModule } from './backoffice/actions/backoffice-actions.module';
import { BackofficeSystemConfigModule } from './backoffice/system-config/backoffice-system-config.module';
import { BackofficeRolesModule } from './backoffice/roles/backoffice-roles.module';
import { BackofficeSpendingLimitsModule } from './backoffice/spending-limits/spending-limits.module';
import { NewsModule } from './backoffice/news/news.module';

import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Core modules
    ConfigModule,
    LoggerModule,
    SqsModule,
    CronosModule,
    SharedRenaperModule,
    BindModule,
    StorageModule,
    MantecaModule,
    PrismaModule,
    JwtModule,
    CrudModule,
    HealthModule,
    SpendingLimitsModule,
    // Public modules
    PublicAuthModule,
    PublicOnboardingModule,
    PublicUsersModule,
    BiometricModule,
    WebhooksModule,
    ComplianceModule,
    // Secure modules
    SecureTransactionsModule,
    SecureExchangeModule,
    SecureLedgerModule,
    SecureTreasuryModule,
    SecureNotificationsModule,
    ActionsAppModule,
    AppInfoModule,
    CampaignsModule,
    TermsModule,
    SecureMantecaModule,
    SecureCronosModule,
    SecureGireModule,
    SecureCoelsaModule,
    SecureBindModule,
    // New secure modules
    CardsModule,
    CreditsModule,
    ContactsModule,
    StoresModule,
    CategoriesModule,
    BenefitsModule,
    BranchesModule,
    SailpointsModule,
    RenaperModule,
    MicronautaModule,
    ValidaModule,
    AccreditationsModule,
    SandboxModule,
    TasksModule,
    PushModule,
    UsersDataModule,
    // Backoffice modules
    BackofficeAuthModule,
    BackofficeClientsModule,
    BackofficeUsersModule,
    BackofficeOnboardingModule,
    BackofficeActionsModule,
    BackofficeSystemConfigModule,
    BackofficeRolesModule,
    BackofficeSpendingLimitsModule,
    NewsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppModel,
    AppMapper,
    CursorPaginatorService,
    QueryHelpers,
  ],
})
export class AppModule {}
