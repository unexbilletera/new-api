import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';

/**
 * Módulo de tesouraria (área logada)
 * Responsável por: gestão de saldos, reconciliação
 */
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class SecureTreasuryModule {}

