export class LogResponseDto {
  id: string;
  userId: string;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export class ListLogsResponseDto {
  data: LogResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class GetLogDetailsResponseDto {
  log: LogResponseDto;
}
