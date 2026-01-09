import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ValidaService } from './valida.service';
import { AppConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [ConfigModule, AppConfigModule, LoggerModule],
  providers: [ValidaService],
  exports: [ValidaService],
})
export class ValidaModule {}
