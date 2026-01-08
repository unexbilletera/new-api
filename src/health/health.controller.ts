import { Controller, Get } from '@nestjs/common';
import { HealthService } from './services/health.service';
import { HealthResponseDto } from './dto/response';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check(): Promise<HealthResponseDto> {
    return this.healthService.check();
  }
}
