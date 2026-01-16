import { Injectable } from '@nestjs/common';
import {
  ConsoleAdapterLogger,
  SmsAdapter,
  SmsMessage,
} from '../notifications.types';

@Injectable()
export class ConsoleSmsAdapter implements SmsAdapter {
  private readonly logger = new ConsoleAdapterLogger();

  async send(message: SmsMessage): Promise<void> {
    this.logger.log('sms', message);
  }
}
