import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { BindModule as SharedBindModule } from '../../shared/bind/bind.module';
import { BindController } from './controllers/bind.controller';
import { BindWebhookController } from './controllers/bind-webhook.controller';
import { BindOperationsService } from './services/bind-operations.service';

@Module({
  imports: [PrismaModule, SharedBindModule],
  controllers: [BindController, BindWebhookController],
  providers: [BindOperationsService],
  exports: [BindOperationsService],
})
export class SecureBindModule {}
