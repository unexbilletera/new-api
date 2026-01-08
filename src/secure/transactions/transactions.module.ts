import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { PixCronosModule } from './pix-cronos/pix-cronos.module';

/**
 * Módulo de transações (área logada)
 * Responsável por: criar transações, consultar histórico, status
 */
@Module({
  imports: [PrismaModule, PixCronosModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class SecureTransactionsModule {}

