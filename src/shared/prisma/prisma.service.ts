import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// Import types from generated/prisma for TypeScript type checking
import type { PrismaClient as GeneratedPrismaClient } from '../../../generated/prisma';

// Runtime import - load PrismaClient dynamically from generated/prisma
// This works in both development (from src/) and production (from dist/)
interface PrismaModule {
  PrismaClient: new (...args: unknown[]) => GeneratedPrismaClient;
}

function loadPrismaClient(): new (...args: unknown[]) => GeneratedPrismaClient {
  const paths = [
    '../../../generated/prisma', // From src/shared/prisma/ (development - watch mode)
    '../../generated/prisma', // From dist/src/shared/prisma/ (production - compiled)
    '../../../../generated/prisma', // Fallback: from project root (if generated/prisma exists in root)
  ];

  for (const modulePath of paths) {
    try {
      // Dynamic require is necessary to load PrismaClient at runtime
      // The Prisma client is generated in generated/prisma, not node_modules/.prisma/client
      // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
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
      // Path not found, try next
      continue;
    }
  }

  throw new Error(
    'PrismaClient not found. Please run "prisma generate" to generate the Prisma client in generated/prisma.',
  );
}

const PrismaClientClass = loadPrismaClient();

/**
 * PrismaService com tipagem correta
 * Estende PrismaClient para garantir type safety
 * Usa PrismaClient gerado em generated/prisma (custom output location)
 *
 * TypeScript usa os tipos de GeneratedPrismaClient para autocomplete e type checking
 * Runtime usa o cliente carregado dinamicamente de generated/prisma
 *
 * IMPORTANT: This class is typed as GeneratedPrismaClient, but the actual implementation
 * is loaded dynamically at runtime. TypeScript will provide full type checking and
 * autocomplete for all Prisma models (users, transactions, backofficeUsers, etc.)
 */
@Injectable()
export class PrismaService
  extends (PrismaClientClass as unknown as new (
    ...args: unknown[]
  ) => GeneratedPrismaClient)
  implements OnModuleInit, OnModuleDestroy, GeneratedPrismaClient
{
  constructor() {
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
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

// Type assertion to make TypeScript recognize PrismaService as GeneratedPrismaClient
// This allows autocomplete and type checking for all Prisma models
export type PrismaServiceType = GeneratedPrismaClient;
