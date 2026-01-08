import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient as GeneratedPrismaClient, Prisma } from '../../../generated/prisma';

@Injectable()
export class PrismaService
  extends GeneratedPrismaClient
  implements OnModuleInit, OnModuleDestroy
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
    const match = query.match(/FROM\s+`?(\w+)`?/i) || query.match(/INTO\s+`?(\w+)`?/i) || query.match(/UPDATE\s+`?(\w+)`?/i);
    return match ? match[1] : '';
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
