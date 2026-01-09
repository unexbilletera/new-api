import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './services/health.service';
import { HealthResponseDto } from './dto/response';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'API health check',
    description: 'Checks if the API is online and working correctly',
  })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    type: HealthResponseDto,
  })
  async check(): Promise<HealthResponseDto> {
    return this.healthService.check();
  }
}
