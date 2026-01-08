import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './services/health.service';
import { HealthModel } from './models/health.model';
import { HealthMapper } from './mappers/health.mapper';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { LoggerModule } from '../shared/logger/logger.module';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [HealthController],
  providers: [HealthService, HealthModel, HealthMapper],
  exports: [HealthService, HealthModel, HealthMapper],
})
export class HealthModule {}
