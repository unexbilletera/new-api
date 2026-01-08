import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerModule } from '../logger/logger.module';
import { AccessLogService } from './access-log.service';

@Module({
  imports: [PrismaModule, LoggerModule],
  providers: [AccessLogService],
  exports: [AccessLogService],
})
export class AccessLogModule {}
