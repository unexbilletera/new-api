import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { LogsController } from './controllers/logs.controller';
import { LogsService } from './services/logs.service';
import { BackofficeRoleGuard } from '../../shared/guards/backoffice-role.guard';

@Module({
  imports: [PrismaModule],
  controllers: [LogsController],
  providers: [LogsService, BackofficeRoleGuard],
  exports: [LogsService],
})
export class BackofficeLogsModule {}
