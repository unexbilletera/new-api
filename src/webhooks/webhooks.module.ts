import { Module } from '@nestjs/common';
import { CronosWebhookModule } from './cronos/cronos-webhook.module';

@Module({
  imports: [CronosWebhookModule],
  controllers: [],
  providers: [],
  exports: [CronosWebhookModule],
})
export class WebhooksModule {}
