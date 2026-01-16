import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { WebhooksController } from './controllers/webhooks.controller';
import { WebhooksService } from './services/webhooks.service';

@Module({
  imports: [PrismaModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
