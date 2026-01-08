import { Global, Module } from '@nestjs/common';
import { SqsService } from './sqs.service';
import { SqsReceiverService } from './sqs-receiver.service';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';

@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [SqsService, SqsReceiverService],
  exports: [SqsService, SqsReceiverService],
})
export class SqsModule {}

