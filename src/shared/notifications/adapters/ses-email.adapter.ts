import { Injectable, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { EmailAdapter, EmailMessage } from '../notifications.types';

@Injectable()
export class SesEmailAdapter implements EmailAdapter {
  private readonly logger = new Logger('SesEmailAdapter');
  private readonly client: SESClient;
  private readonly source: string;

  constructor(params: { accessKeyId: string; secretAccessKey: string; region: string; source: string }) {
    this.client = new SESClient({
      region: params.region,
      credentials: {
        accessKeyId: params.accessKeyId,
        secretAccessKey: params.secretAccessKey,
      },
    });
    this.source = params.source;
  }

  async send(message: EmailMessage): Promise<void> {
    const command = new SendEmailCommand({
      Source: this.source,
      Destination: {
        ToAddresses: [message.to],
      },
      Message: {
        Subject: { Data: message.subject, Charset: 'UTF-8' },
        Body: {
          Html: message.html ? { Data: message.html, Charset: 'UTF-8' } : undefined,
          Text: message.text ? { Data: message.text, Charset: 'UTF-8' } : undefined,
        },
      },
    });

    try {
      await this.client.send(command);
      this.logger.log(`Email sent via SES to ${message.to}`);
    } catch (error) {
      this.logger.error('Failed to send email via SES', error as Error, { to: message.to });
      throw error;
    }
  }
}
