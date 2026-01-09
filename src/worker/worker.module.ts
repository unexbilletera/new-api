import { Module } from '@nestjs/common';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { SqsModule } from '../shared/sqs/sqs.module';
import { LoggerModule } from '../shared/logger/logger.module';
import { ConfigModule } from '../shared/config/config.module';
import { CronosModule } from '../shared/cronos/cronos.module';
import { WorkerService } from './worker.service';
import { PixCronosHandler } from './handlers/pix-cronos.handler';

/**
 * Módulo Worker
 * Responsável por: processar fila SQS, atualizar status de transações
 */
@Module({
  imports: [PrismaModule, SqsModule, LoggerModule, ConfigModule, CronosModule],
  controllers: [],
  providers: [WorkerService, PixCronosHandler],
  exports: [WorkerService],
})
export class WorkerModule {}

