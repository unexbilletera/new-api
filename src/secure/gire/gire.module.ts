import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { GireController } from './controllers/gire.controller';
import { GireWebhookController } from './controllers/gire-webhook.controller';
import { GireService } from './services/gire.service';

@Module({
  imports: [PrismaModule],
  controllers: [GireController, GireWebhookController],
  providers: [GireService],
  exports: [GireService],
})
export class SecureGireModule {}
