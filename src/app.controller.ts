import { Controller, Get } from '@nestjs/common';
import { AppService } from './app/services/app.service';
import { AppGreetingResponseDto } from './app/dto/response';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): AppGreetingResponseDto {
    return this.appService.getHello();
  }
}
