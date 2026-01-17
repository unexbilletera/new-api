import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { WebhooksController } from './controllers/webhooks.controller';
import { WebhooksService } from './services/webhooks.service';
import { CronosWebhookModule } from '../../webhooks/cronos/cronos-webhook.module';

@Module({
  imports: [PrismaModule, CronosWebhookModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService, CronosWebhookModule],
})
export class WebhooksModule {}
