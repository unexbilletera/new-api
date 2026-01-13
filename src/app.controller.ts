import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app/services/app.service';
import { AppGreetingResponseDto } from './app/dto/response';

@ApiTags('5. Shared')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'API greeting',
    description: 'Returns a simple greeting message from the API',
  })
  @ApiResponse({
    status: 200,
    description: 'Greeting message retrieved successfully',
    type: AppGreetingResponseDto,
  })
  getHello(): AppGreetingResponseDto {
    return this.appService.getHello();
  }
}
