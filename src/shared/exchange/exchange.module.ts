import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerModule } from '../logger/logger.module';
import { ExchangeRatesService } from './exchange-rates.service';

@Module({
  imports: [ConfigModule, PrismaModule, LoggerModule],
  providers: [ExchangeRatesService],
  exports: [ExchangeRatesService],
})
export class ExchangeModule {}
