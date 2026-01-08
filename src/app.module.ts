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

import { SecureTransactionsModule } from './secure/transactions/transactions.module';
import { SecureExchangeModule } from './secure/exchange/exchange.module';
import { SecureLedgerModule } from './secure/ledger/ledger.module';
import { SecureTreasuryModule } from './secure/treasury/treasury.module';
import { SecureNotificationsModule } from './secure/notifications/notifications.module';

import { BackofficeAuthModule } from './backoffice/auth/auth.module';

import { WebhooksModule } from './webhooks/webhooks.module';

import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule, // Módulo de configuração global
    LoggerModule, // Módulo Logger global
    SqsModule, // Módulo SQS global
    PrismaModule,
    JwtModule,
    HealthModule,
    PublicAuthModule,
    PublicOnboardingModule,
    PublicUsersModule,
    SecureTransactionsModule,
    SecureExchangeModule,
    SecureLedgerModule,
    SecureTreasuryModule,
    SecureNotificationsModule,
    BackofficeAuthModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppModel, AppMapper],
})
export class AppModule {}
