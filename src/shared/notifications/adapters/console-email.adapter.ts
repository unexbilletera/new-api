import { Injectable } from '@nestjs/common';
import { ConsoleAdapterLogger, EmailAdapter, EmailMessage } from '../notifications.types';

@Injectable()
export class ConsoleEmailAdapter implements EmailAdapter {
  private readonly logger = new ConsoleAdapterLogger();

  async send(message: EmailMessage): Promise<void> {
    this.logger.log('email', message);
  }
}
