import { Injectable, Logger } from '@nestjs/common';
import { SmsAdapter, SmsMessage } from '../notifications.types';

let twilioClient: any = null;

try {
  const twilio = require('twilio');
  twilioClient = twilio;
} catch (error) {
}

@Injectable()
export class TwilioSmsAdapter implements SmsAdapter {
  private readonly logger = new Logger('TwilioSmsAdapter');
  private readonly client: any;
  private readonly from: string;

  constructor(params: { accountSid: string; authToken: string; from: string }) {
    if (!twilioClient) {
      throw new Error('Twilio package is not installed. Run: npm install twilio');
    }

    this.client = twilioClient(params.accountSid, params.authToken);
    this.from = params.from;
  }

  private normalizePhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    
    if (!phone.startsWith('+')) {
      return `+${digits}`;
    }
    
    return phone;
  }

  async send(message: SmsMessage): Promise<void> {
    try {
      const normalizedTo = this.normalizePhoneNumber(message.to);
      
      const result = await this.client.messages.create({
        body: message.message,
        from: this.from,
        to: normalizedTo,
      });

      this.logger.log(`SMS sent via Twilio to ${normalizedTo}`, { sid: result.sid });
    } catch (error) {
      this.logger.error('Failed to send SMS via Twilio', error as Error, { to: message.to });
      throw error;
    }
  }
}
