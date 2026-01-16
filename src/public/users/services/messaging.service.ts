import { Injectable } from '@nestjs/common';
import { SendMessageDto } from '../dto/user-profile.dto';
import { MessagingResponseDto } from '../dto/response';

@Injectable()
export class MessagingService {
  async sendMessage(
    userId: string,
    dto: SendMessageDto,
  ): Promise<MessagingResponseDto> {
    return {
      message: 'Message sent successfully',
    };
  }
}
