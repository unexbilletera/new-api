import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

// Load PrismaClient dynamically at runtime with fallbacks
function loadPrismaClient() {
  try {
    // Try to load from generated folder (dev mode with generated at root)
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    return require('../../../generated/prisma').PrismaClient;
  } catch {
    try {
      // Try alternative path
      // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
      return require('../../../../generated/prisma').PrismaClient;
    } catch {
      // Final fallback: load from npm package
      // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
      return require('@prisma/client').PrismaClient;
    }
  }
}

const PrismaClient = loadPrismaClient();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    super({
      log:
        process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    } as any);
  }

  async onModuleInit(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.$disconnect();
  }
}
