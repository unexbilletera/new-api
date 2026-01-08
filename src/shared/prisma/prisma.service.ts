import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient as GeneratedPrismaClient } from '../../../generated/prisma';

@Injectable()
export class PrismaService
  extends GeneratedPrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
