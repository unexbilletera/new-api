import { Global, Module } from '@nestjs/common';
import { CronosService } from './cronos.service';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';

@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [CronosService],
  exports: [CronosService],
})
export class CronosModule {}

