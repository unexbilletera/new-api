import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { CoelsaController } from './controllers/coelsa.controller';
import { CoelsaWebhookController } from './controllers/coelsa-webhook.controller';
import { CoelsaService } from './services/coelsa.service';

@Module({
  imports: [PrismaModule],
  controllers: [CoelsaController, CoelsaWebhookController],
  providers: [CoelsaService],
  exports: [CoelsaService],
})
export class SecureCoelsaModule {}
