import { Injectable } from '@nestjs/common';
import { HealthModel } from '../models/health.model';
import { HealthMapper } from '../mappers/health.mapper';
import { HealthResponseDto } from '../dto/response';
import { LoggerService } from '../../shared/logger/logger.service';

@Injectable()
export class HealthService {
  constructor(
    private healthModel: HealthModel,
    private healthMapper: HealthMapper,
    private logger: LoggerService,
  ) {}

  async check(): Promise<HealthResponseDto> {
    const uptime = this.healthModel.getUptime();
    const uptimeFormatted = `${Math.floor(uptime)}s`;
    const timestamp = this.healthModel.getCurrentTimestamp();
    const serverStatus = this.healthModel.getServerStatus();
    const isDatabaseUp = await this.healthModel.checkDatabase();
    const databaseStatus = isDatabaseUp ? 'up' : 'down';

    if (!isDatabaseUp) {
      this.logger.error('Health check failed: Database is down');
    }

    const status = isDatabaseUp ? 'ok' : 'error';

    if (status === 'ok') {
      this.logger.debug('Health check passed', {
        status,
        uptime: uptimeFormatted,
        timestamp,
      });
    }

    return this.healthMapper.toHealthResponseDto(
      status,
      uptimeFormatted,
      timestamp,
      databaseStatus,
      serverStatus,
    );
  }
}
