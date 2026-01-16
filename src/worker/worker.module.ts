import { Module } from '@nestjs/common';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { SqsModule } from '../shared/sqs/sqs.module';
import { LoggerModule } from '../shared/logger/logger.module';
import { ConfigModule } from '../shared/config/config.module';
import { CronosModule } from '../shared/cronos/cronos.module';
import { WorkerService } from './worker.service';
import { PixCronosHandler } from './handlers/pix-cronos.handler';
import { PixCronosValidationService } from '../secure/transactions/cronos/pix-cronos/services/pix-cronos-validation.service';

@Module({
  imports: [PrismaModule, SqsModule, LoggerModule, ConfigModule, CronosModule],
  controllers: [],
  providers: [WorkerService, PixCronosHandler, PixCronosValidationService],
  exports: [WorkerService],
})
export class WorkerModule {}
