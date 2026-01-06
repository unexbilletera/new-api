import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class HealthModel {
  constructor(private prisma: PrismaService) {}

  async checkDatabase(): Promise<boolean> {
    try {
      await (this.prisma as any).$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  getServerStatus(): string {
    return 'up';
  }

  getUptime(): number {
    return process.uptime();
  }

  getCurrentTimestamp(): string {
    return new Date().toISOString();
  }
}
