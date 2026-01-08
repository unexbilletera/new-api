import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// Import PrismaClient directly with proper types
// Use generated/prisma which has all the types from the schema
import { PrismaClient as GeneratedPrismaClient } from '../../../generated/prisma';

/**
 * PrismaService com tipagem correta
 * Estende PrismaClient para garantir type safety
 * Usa GeneratedPrismaClient que tem todos os tipos do schema
 */
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
