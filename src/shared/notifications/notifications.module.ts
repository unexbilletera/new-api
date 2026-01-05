import { Global, Module } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { ConsoleEmailAdapter } from './adapters/console-email.adapter';
import { ConsoleSmsAdapter } from './adapters/console-sms.adapter';
import { ConsolePushAdapter } from './adapters/console-push.adapter';
import { EMAIL_ADAPTER, PUSH_ADAPTER, SMS_ADAPTER } from './notifications.types';

@Global()
@Module({
  providers: [
    NotificationService,
    { provide: EMAIL_ADAPTER, useClass: ConsoleEmailAdapter },
    { provide: SMS_ADAPTER, useClass: ConsoleSmsAdapter },
    { provide: PUSH_ADAPTER, useClass: ConsolePushAdapter },
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
