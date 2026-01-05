import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { LoggerService } from '../shared/logger/logger.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  @Get()
  async check() {
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();
    
    let databaseStatus = 'up';
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
      await (this.prisma as any).$queryRaw`SELECT 1`;
    } catch (error) {
      databaseStatus = 'down';
      this.logger.error('Health check failed: Database is down', error);
    }

    const health = {
      status: databaseStatus === 'up' ? 'ok' : 'error',
      uptime: `${Math.floor(uptime)}s`,
      timestamp,
      checks: {
        database: databaseStatus,
        server: 'up',
      },
    };

    if (health.status === 'ok') {
      this.logger.debug('Health check passed', health);
    }

    return health;
  }
}
