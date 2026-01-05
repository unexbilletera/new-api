import { Logger } from '@nestjs/common';

export interface EmailMessage {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  metadata?: Record<string, string>;
}

export interface SmsMessage {
  to: string;
  message: string;
  metadata?: Record<string, string>;
}

export interface PushMessage {
  title: string;
  body: string;
  token?: string;
  userId?: string;
  data?: Record<string, string>;
}

export interface EmailAdapter {
  send(message: EmailMessage): Promise<void>;
}

export interface SmsAdapter {
  send(message: SmsMessage): Promise<void>;
}

export interface PushAdapter {
  send(message: PushMessage): Promise<void>;
}

export const EMAIL_ADAPTER = 'EMAIL_ADAPTER';
export const SMS_ADAPTER = 'SMS_ADAPTER';
export const PUSH_ADAPTER = 'PUSH_ADAPTER';

export class ConsoleAdapterLogger {
  private readonly logger = new Logger('NotificationAdapter');

  log(channel: string, payload: unknown) {
    const serialized = this.safeStringify(payload);
    this.logger.log(`[${channel}] ${serialized}`);
  }

  private safeStringify(payload: unknown): string {
    try {
      return JSON.stringify(payload);
    } catch (error) {
      return '[unserializable payload]';
    }
  }
}
