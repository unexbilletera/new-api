import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from '../dto/response';

@Injectable()
export class HealthMapper {
  toHealthResponseDto(
    status: string,
    uptime: string,
    timestamp: string,
    databaseStatus: string,
    serverStatus: string,
  ): HealthResponseDto {
    return {
      status,
      uptime,
      timestamp,
      checks: {
        database: databaseStatus,
        server: serverStatus,
      },
    };
  }
}
