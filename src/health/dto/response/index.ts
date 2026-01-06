export class HealthChecksDto {
  database: string;
  server: string;
}

export class HealthResponseDto {
  status: string;
  uptime: string;
  timestamp: string;
  checks: HealthChecksDto;
}
