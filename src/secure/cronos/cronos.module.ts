import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { CronosModule as SharedCronosModule } from '../../shared/cronos/cronos.module';
import { CronosController } from './controllers/cronos.controller';
import { CronosWebhookController } from './controllers/cronos-webhook.controller';
import { CronosOperationsService } from './services/cronos-operations.service';

@Module({
  imports: [PrismaModule, SharedCronosModule],
  controllers: [CronosController, CronosWebhookController],
  providers: [CronosOperationsService],
  exports: [CronosOperationsService],
})
export class SecureCronosModule {}
