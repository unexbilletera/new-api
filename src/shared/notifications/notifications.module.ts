import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notifications.service';
import { ConsoleEmailAdapter } from './adapters/console-email.adapter';
import { ConsoleSmsAdapter } from './adapters/console-sms.adapter';
import { ConsolePushAdapter } from './adapters/console-push.adapter';
import { SesEmailAdapter } from './adapters/ses-email.adapter';
import { EMAIL_ADAPTER, PUSH_ADAPTER, SMS_ADAPTER } from './notifications.types';

@Global()
@Module({
  providers: [
    NotificationService,
    {
      provide: EMAIL_ADAPTER,
      useFactory: (config: ConfigService) => {
        const accessKeyId = config.get<string>('WALLET_EMAIL_KEY') || '';
        const secretAccessKey = config.get<string>('WALLET_EMAIL_PASSWORD') || '';
        const region = config.get<string>('WALLET_EMAIL_REGION') || config.get<string>('AWS_REGION') || 'us-east-1';
        const source = config.get<string>('WALLET_SERVER_MAIL_FROM') || 'noreply@unex.ar';
        const sandboxSendMail = (config.get<string>('WALLET_SANDBOX_SEND_MAIL') || '').toLowerCase() === 'true';
        const nodeEnv = (config.get<string>('NODE_ENV') || '').toLowerCase();

        const hasCreds = accessKeyId && secretAccessKey;
        const allowSend = nodeEnv === 'production' || sandboxSendMail;

        if (hasCreds && allowSend) {
          return new SesEmailAdapter({ accessKeyId, secretAccessKey, region, source });
        }

        return new ConsoleEmailAdapter();
      },
      inject: [ConfigService],
    },
    { provide: SMS_ADAPTER, useClass: ConsoleSmsAdapter },
    { provide: PUSH_ADAPTER, useClass: ConsolePushAdapter },
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
