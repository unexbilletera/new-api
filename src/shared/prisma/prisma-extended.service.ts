import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PrismaExtendedService extends PrismaClient implements OnModuleInit {
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
    super();
  }

  async onModuleInit() {
    this.$use(async (params, next) => {
      const { model, action, args } = params;

      if (
        this.softDeleteModels.includes(model) &&
        ['findUnique', 'findFirst', 'findMany', 'count'].includes(action)
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

    this.$use(async (params, next) => {
      const start = Date.now();
      const result = await next(params);
      const duration = Date.now() - start;

      if (duration > 1000) {
        this.logger.warn(
          `Slow query detected: ${params.model}.${params.action} took ${duration}ms`,
        );
      }

      return result;
    });
  }
}
