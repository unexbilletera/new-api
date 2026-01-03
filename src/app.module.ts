import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/prisma/prisma.module';
import { JwtModule } from './shared/jwt/jwt.module';

// Public modules (não logado)
import { PublicAuthModule } from './public/auth/auth.module';
import { PublicOnboardingModule } from './public/onboarding/onboarding.module';
import { PublicUsersModule } from './public/users/users.module';

// Secure modules (logado)
import { SecureTransactionsModule } from './secure/transactions/transactions.module';
import { SecureExchangeModule } from './secure/exchange/exchange.module';
import { SecureLedgerModule } from './secure/ledger/ledger.module';
import { SecureTreasuryModule } from './secure/treasury/treasury.module';
import { SecureNotificationsModule } from './secure/notifications/notifications.module';

// Backoffice modules
import { BackofficeAuthModule } from './backoffice/auth/auth.module';

// Webhooks
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule, // Módulo JWT global
    // Public (não logado)
    PublicAuthModule,
    PublicOnboardingModule,
    PublicUsersModule,
    // Secure (logado)
    SecureTransactionsModule,
    SecureExchangeModule,
    SecureLedgerModule,
    SecureTreasuryModule,
    SecureNotificationsModule,
    // Backoffice
    BackofficeAuthModule,
    // Webhooks
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
