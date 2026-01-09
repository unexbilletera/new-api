import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { ClientsController } from './controllers/clients.controller';
import { ClientsService } from './services/clients.service';
import { BackofficeRoleGuard } from '../../shared/guards/backoffice-role.guard';

@Module({
  imports: [PrismaModule],
  controllers: [ClientsController],
  providers: [ClientsService, BackofficeRoleGuard],
  exports: [ClientsService],
})
export class BackofficeClientsModule {}
