import { Global, Module } from '@nestjs/common';
import { CronosService } from './cronos.service';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [ConfigModule, LoggerModule, PrismaModule],
  providers: [CronosService],
  exports: [CronosService],
})
export class CronosModule {}
