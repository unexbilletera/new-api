import { Module } from '@nestjs/common';
import { CronosWebhookController } from './cronos/controllers/cronos-webhook.controller';
import { CronosWebhookService } from './cronos/services/cronos-webhook.service';
import { CronosModule } from '../shared/cronos/cronos.module';
import { PrismaModule } from '../shared/prisma/prisma.module';

@Module({
  imports: [CronosModule, PrismaModule],
  controllers: [CronosWebhookController],
  providers: [CronosWebhookService],
  exports: [],
})
export class WebhooksModule {}

