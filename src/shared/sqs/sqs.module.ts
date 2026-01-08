import { Global, Module } from '@nestjs/common';
import { SqsService } from './sqs.service';
import { SqsReceiverService } from './sqs-receiver.service';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';

/**
 * Módulo SQS global
 * Fornece serviços para enviar e receber mensagens de filas SQS
 */
@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [SqsService, SqsReceiverService],
  exports: [SqsService, SqsReceiverService],
})
export class SqsModule {}

