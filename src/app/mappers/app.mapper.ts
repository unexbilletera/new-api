import { Injectable } from '@nestjs/common';
import { AppGreetingResponseDto } from '../dto/response';

@Injectable()
export class AppMapper {
  toGreetingResponseDto(message: string): AppGreetingResponseDto {
    return { message };
  }
}
