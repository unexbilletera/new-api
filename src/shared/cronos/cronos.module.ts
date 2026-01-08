import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerModule } from '../logger/logger.module';
import { CronosService } from './cronos.service';

@Module({
  imports: [ConfigModule, PrismaModule, LoggerModule],
  providers: [CronosService],
  exports: [CronosService],
})
export class CronosModule {}
