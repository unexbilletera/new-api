import { Injectable } from '@nestjs/common';
import { LogResponseDto, ListLogsResponseDto, GetLogDetailsResponseDto } from '../dto/response';

@Injectable()
export class LogMapper {
  toLogResponseDto(log: any): LogResponseDto {
    return {
      id: log.id,
      userId: log.userId,
      action: log.action,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    };
  }

  toListLogsResponseDto(logs: any[], total: number, page: number, limit: number): ListLogsResponseDto {
    return {
      data: logs.map((l) => this.toLogResponseDto(l)),
      total,
      page,
      limit,
    };
  }

  toGetLogDetailsResponseDto(log: any): GetLogDetailsResponseDto {
    return {
      log: this.toLogResponseDto(log),
    };
  }
}
