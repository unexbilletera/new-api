import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app/services/app.service';
import { AppModel } from './app/models/app.model';
import { AppMapper } from './app/mappers/app.mapper';
import { PrismaModule } from './shared/prisma/prisma.module';
import { JwtModule } from './shared/jwt/jwt.module';
import { ConfigModule } from './shared/config/config.module';
import { ConfigService } from './shared/config/config.service';
import { LoggerModule } from './shared/logger/logger.module';
import { SqsModule } from './shared/sqs/sqs.module';
import { CronosModule } from './shared/cronos/cronos.module';
import Redis from 'ioredis';
import { ThrottlerRedisStorage } from './shared/throttler/throttler-redis.storage';

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
    ConfigModule, // Módulo de configuração global
    LoggerModule, // Módulo Logger global
    SqsModule, // Módulo SQS global
    CronosModule, // Módulo Cronos global
    // Configurar ThrottlerModule com Redis para rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.redisUrl;

        // Se tiver Redis configurado, usar Redis storage
        if (redisUrl) {
          // Parse Redis URL: redis:// ou rediss:// (com SSL) [password@]host[:port][/database]
          // Aceita URLs com ou sem porta (porta padrão: 6379)
          const redisMatch = redisUrl.match(
            /^rediss?:\/\/(?:([^@]+)@)?([^:/]+)(?::(\d+))?(?:\/(\d+))?$/,
          );

          if (redisMatch) {
            const [, authPart, host, port, db] = redisMatch;
            let username: string | undefined;
            let password: string | undefined;

            if (authPart) {
              if (authPart.includes(':')) {
                const [user, pass] = authPart.split(':', 2);
                username = user || undefined;
                password = pass || undefined;
              } else {
                password = authPart;
              }
            }
            const useTLS = redisUrl.startsWith('rediss://');
            const defaultPort = '6379';

            const redisClient: Redis = new Redis({
              host: host || 'localhost',
              port: parseInt(port || defaultPort, 10),
              username: username || undefined,
              password: password || undefined,
              db: db ? parseInt(db, 10) : 0,
              tls: useTLS
                ? {
                    // Configuração TLS para ElastiCache/Valkey
                    rejectUnauthorized: false, // Aceitar certificados auto-assinados
                  }
                : undefined,
              retryStrategy: () => null, // Desabilitar reconexão automática
              maxRetriesPerRequest: 1, // Apenas 1 tentativa
              enableOfflineQueue: false, // Não enfileirar comandos quando desconectado
              lazyConnect: true, // Não conectar automaticamente
              connectTimeout: 5000, // Timeout de 5 segundos
            });

            // Contador para limitar logs de erro
            let errorLogCount = 0;
            const MAX_ERROR_LOGS = 3; // Logar apenas os primeiros 3 erros

            // Tratar erros de conexão para evitar "Unhandled error event"
            redisClient.on('error', (error: Error) => {
              errorLogCount++;
              // Log apenas os primeiros erros para não poluir o console
              if (errorLogCount <= MAX_ERROR_LOGS) {
                if (errorLogCount === 1) {
                  console.warn(
                    `[ThrottlerModule] ⚠️ Redis não disponível (usando in-memory fallback). Erro: ${error.message}`,
                  );
                } else if (errorLogCount === MAX_ERROR_LOGS) {
                  console.warn(
                    `[ThrottlerModule] Redis continua indisponível. Silenciando logs adicionais.`,
                  );
                }
              }
            });

            // Não tentar conectar automaticamente
            // A conexão será feita sob demanda quando necessário
            // O ThrottlerRedisStorage tratará erros de conexão
            console.log(
              '[ThrottlerModule] Redis configurado. Conexão será estabelecida sob demanda.',
            );

            // Teste inicial de conexão (não bloqueante)
            const withTimeout = async <T>(
              promise: Promise<T>,
              ms: number,
              errorMessage: string,
            ): Promise<T> =>
              await Promise.race([
                promise,
                new Promise<T>((_, reject) =>
                  setTimeout(() => reject(new Error(errorMessage)), ms),
                ),
              ]);

            void (async () => {
              try {
                await withTimeout(
                  redisClient.connect(),
                  5000,
                  'Timeout ao conectar no Redis (5s)',
                );
                await withTimeout(
                  redisClient.ping(),
                  3000,
                  'Timeout ao executar PING no Redis (3s)',
                );
                console.log(
                  '[ThrottlerModule] ✅ Redis conectado e respondendo.',
                );
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : 'Erro desconhecido';
                console.warn(
                  `[ThrottlerModule] ⚠️ Falha no teste inicial do Redis: ${message}`,
                );
              }
            })();

            return {
              throttlers: [
                {
                  name: 'default',
                  ttl: 60000, // 60 segundos
                  limit: 10, // 10 requisições por 60 segundos (padrão)
                },
              ],
              storage: new ThrottlerRedisStorage(redisClient),
            };
          }
        }

        // Fallback para in-memory se Redis não estiver configurado
        return {
          throttlers: [
            {
              name: 'default',
              ttl: 60000, // 60 segundos
              limit: 10, // 10 requisições por 60 segundos (padrão)
            },
          ],
        };
      },
    }),
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
  providers: [
    AppService,
    AppModel,
    AppMapper,
    // Aplicar ThrottlerGuard globalmente (pode ser sobrescrito por endpoint)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
