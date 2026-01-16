import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppConfigService, ConfigService } from './config.service';
import { MockCodeValidatorHelper } from './mock-code-validator.helper';
import { LoggerModule } from '../logger/logger.module';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),
    LoggerModule,
  ],
  providers: [AppConfigService, ConfigService, MockCodeValidatorHelper],
  exports: [AppConfigService, ConfigService, MockCodeValidatorHelper],
})
export class ConfigModule {}

export { ConfigModule as AppConfigModule };
