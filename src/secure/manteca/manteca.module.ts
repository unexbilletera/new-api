import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { MantecaModule as SharedMantecaModule } from '../../shared/manteca/manteca.module';
import { SpendingLimitsModule } from '../../shared/spending-limits/spending-limits.module';
import { MantecaController } from './controllers/manteca.controller';
import { MantecaWebhookController } from './controllers/manteca-webhook.controller';
import { MantecaOperationsService } from './services/manteca-operations.service';
import { MantecaWebhookService } from './services/manteca-webhook.service';

@Module({
  imports: [PrismaModule, SharedMantecaModule, SpendingLimitsModule],
  controllers: [MantecaController, MantecaWebhookController],
  providers: [MantecaOperationsService, MantecaWebhookService],
  exports: [MantecaOperationsService, MantecaWebhookService],
})
export class SecureMantecaModule {}
