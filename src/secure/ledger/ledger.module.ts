import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';

/**
 * Módulo de ledger (área logada)
 * Responsável por: movimentações financeiras, saldos por moeda
 */
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class SecureLedgerModule {}

