import {
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListLogsQueryDto {
  @ApiPropertyOptional({ description: 'User ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Action name' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by success status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  success?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class LogStatsQueryDto {
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)', example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class LogResponseDto {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  action: string;
  success: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: any;
  errorMessage?: string | null;
  createdAt: Date;
}

export class LogStatsDto {
  totalLogs: number;
  successCount: number;
  failureCount: number;
  uniqueUsers: number;
  actionBreakdown: { action: string; count: number }[];
}
