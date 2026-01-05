import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
function loadPrismaClient() {
  try {
    return require('../../../generated/prisma').PrismaClient;
  } catch {
    try {
      return require('../../../../generated/prisma').PrismaClient;
    } catch {
      return require('@prisma/client').PrismaClient;
    }
  }
}

const PrismaClient = loadPrismaClient();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    } as any);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
