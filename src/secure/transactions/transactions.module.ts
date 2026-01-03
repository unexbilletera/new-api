import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';

/**
 * Módulo de transações (área logada)
 * Responsável por: criar transações, consultar histórico, status
 */
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class SecureTransactionsModule {}

