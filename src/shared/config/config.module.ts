import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppConfigService } from './config.service';
import { MockCodeValidatorHelper } from './mock-code-validator.helper';
import { LoggerModule } from '../logger/logger.module';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
    }),
    LoggerModule,
  ],
  providers: [AppConfigService, MockCodeValidatorHelper],
  exports: [AppConfigService, MockCodeValidatorHelper],
})
export class AppConfigModule {}
