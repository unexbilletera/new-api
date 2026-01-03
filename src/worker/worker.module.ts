import { Module } from '@nestjs/common';
import { PrismaModule } from '../shared/prisma/prisma.module';

/**
 * Módulo Worker
 * Responsável por: processar fila SQS, atualizar status de transações
 */
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class WorkerModule {}

