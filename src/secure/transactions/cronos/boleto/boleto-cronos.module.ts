import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../shared/prisma/prisma.module';
import { BoletoCronosController } from './controllers/boleto-cronos.controller';
import { BoletoCronosService } from './services/boleto-cronos.service';
import { BoletoCronosValidationService } from './services/boleto-cronos-validation.service';
import { BoletoCronosTransactionModel } from './models/boleto-cronos-transaction.model';

@Module({
  imports: [PrismaModule],
  controllers: [BoletoCronosController],
  providers: [
    BoletoCronosService,
    BoletoCronosValidationService,
    BoletoCronosTransactionModel,
  ],
  exports: [BoletoCronosService],
})
export class BoletoCronosModule {}
