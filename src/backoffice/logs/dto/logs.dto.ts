import { IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';

export class ListLogsQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  success?: boolean;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
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
