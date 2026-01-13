import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import type {
  PrismaClient as GeneratedPrismaClient,
  Prisma,
} from '../../../generated/prisma';

interface PrismaModule {
  PrismaClient: new (...args: unknown[]) => GeneratedPrismaClient;
}

function loadPrismaClient(): new (...args: unknown[]) => GeneratedPrismaClient {
  const paths = [
    '../../../generated/prisma',
    '../../generated/prisma',
    '../../../../generated/prisma',
  ];

  for (const modulePath of paths) {
    try {
      const prismaModule = require(modulePath) as unknown;
      if (
        prismaModule &&
        typeof prismaModule === 'object' &&
        'PrismaClient' in prismaModule &&
        typeof (prismaModule as { PrismaClient: unknown }).PrismaClient ===
          'function'
      ) {
        return (prismaModule as PrismaModule).PrismaClient;
      }
    } catch {
      continue;
    }
  }

  throw new Error(
    'PrismaClient not found. Please run "prisma generate" to generate the Prisma client in generated/prisma.',
  );
}

const PrismaClientClass = loadPrismaClient();

@Injectable()
export class PrismaService
  extends (PrismaClientClass as unknown as new (
    ...args: unknown[]
  ) => GeneratedPrismaClient)
  implements OnModuleInit, OnModuleDestroy, GeneratedPrismaClient
{
  private readonly softDeleteModels = [
    'users',
    'usersIdentities',
    'usersAccounts',
    'transactions',
    'transactionsLogs',
    'accreditations',
    'benefits',
    'cards',
    'campaign_codes',
    'devices',
    'challenges',
    'contacts',
    'notifications',
    'stores',
    'branches',
    'sailpoints',
    'backofficeLogs',
    'backofficeRoles',
    'backofficeUsers',
  ];

  constructor(private logger: LoggerService) {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'stdout',
          level: process.env.NODE_ENV === 'development' ? 'warn' : 'error',
        },
      ],
      errorFormat: 'pretty',
    });

    this.setupQueryLogger();
    this.setupSoftDeleteMiddleware();
    this.setupSlowQueryLogging();
  }

  private setupSoftDeleteMiddleware(): void {
    this.$use(async (params, next) => {
      const { model, action, args } = params;

      if (
        model &&
        this.softDeleteModels.includes(model as string) &&
        action &&
        ['findUnique', 'findFirst', 'findMany', 'count'].includes(action as string)
      ) {
        if (args.where) {
          args.where = {
            AND: [args.where, { deletedAt: null }],
          };
        } else {
          args.where = { deletedAt: null };
        }
      }

      return next(params);
    });
  }

  private setupSlowQueryLogging(): void {
    this.$use(async (params, next) => {
      const start = Date.now();
      const result = await next(params);
      const duration = Date.now() - start;

      if (duration > 1000) {
        const model = params.model || 'unknown';
        const action = params.action || 'unknown';
        this.logger.warn(
          `Slow query detected: ${model}.${action} took ${duration}ms`,
        );
      }

      return result;
    });
  }

  private setupQueryLogger(): void {
    this.$on('query' as never, (e: Prisma.QueryEvent) => {
      const duration = e.duration ? `${e.duration}ms` : '';
      const operation = this.extractOperation(e.query);
      const model = this.extractModel(e.query);
      console.log(`[SQL] ${operation} ${model} ${duration}`.trim());
    });
  }

  private extractOperation(query: string): string {
    if (!query) return '';
    const match = query.match(/^\s*(\w+)/i);
    return match ? match[1].toUpperCase() : 'QUERY';
  }

  private extractModel(query: string): string {
    if (!query) return '';
    const match =
      query.match(/FROM\s+`?(\w+)`?/i) ||
      query.match(/INTO\s+`?(\w+)`?/i) ||
      query.match(/UPDATE\s+`?(\w+)`?/i);
    return match ? match[1] : '';
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.info('Database connection established successfully');
    } catch (error: any) {
      const errorMessage = error?.message || '';
      let host = 'unknown';
      let port = 'unknown';
      
      const hostPortMatch = errorMessage.match(/at `([^:]+):(\d+)`/);
      if (hostPortMatch) {
        host = hostPortMatch[1];
        port = hostPortMatch[2];
      } else {
        const dbUrl = process.env.DATABASE_URL || process.env.WALLET_MYSQL_URL || '';
        if (dbUrl) {
          const urlMatch = dbUrl.match(/@([^:]+):(\d+)/);
          if (urlMatch) {
            host = urlMatch[1];
            port = urlMatch[2];
          }
        }
      }
      
      this.logger.error(
        `Database connection failed: Cannot reach database server at ${host}:${port}`,
        error instanceof Error ? error : new Error(errorMessage),
        {
          errorCode: error?.errorCode || 'P1001',
        },
      );
      
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

export type PrismaServiceType = GeneratedPrismaClient;
