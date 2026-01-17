import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { CronosModule } from '../../shared/cronos/cronos.module';
import { CronosWebhookController } from './controllers/cronos-webhook.controller';
import { CronosWebhookService } from './services/cronos-webhook.service';

@Module({
  imports: [PrismaModule, CronosModule],
  controllers: [CronosWebhookController],
  providers: [CronosWebhookService],
  exports: [CronosWebhookService],
})
export class CronosWebhookModule {}
