import { Injectable } from '@nestjs/common';
import { ConsoleAdapterLogger, PushAdapter, PushMessage } from '../notifications.types';

@Injectable()
export class ConsolePushAdapter implements PushAdapter {
  private readonly logger = new ConsoleAdapterLogger();

  async send(message: PushMessage): Promise<void> {
    this.logger.log('push', message);
  }
}
