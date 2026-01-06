import { Injectable } from '@nestjs/common';
import { AppModel } from '../models/app.model';
import { AppMapper } from '../mappers/app.mapper';
import { AppGreetingResponseDto } from '../dto/response';

@Injectable()
export class AppService {
  constructor(
    private appModel: AppModel,
    private appMapper: AppMapper,
  ) {}

  getHello(): AppGreetingResponseDto {
    const greeting = this.appModel.getGreeting();
    return this.appMapper.toGreetingResponseDto(greeting);
  }
}
