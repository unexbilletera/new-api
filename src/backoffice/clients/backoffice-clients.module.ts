import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { LoggerModule } from '../../shared/logger/logger.module';
import { CacheService } from '../../shared/performance/cache.service';
import { ClientsController } from './controllers/clients.controller';
import { ClientsService } from './services/clients.service';
import { BackofficeRoleGuard } from '../../shared/guards/backoffice-role.guard';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [ClientsController],
  providers: [ClientsService, CacheService, BackofficeRoleGuard],
  exports: [ClientsService],
})
export class BackofficeClientsModule {}
