import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { RolesController } from './controllers/roles.controller';
import { RolesService } from './services/roles.service';
import { BackofficeRoleGuard } from '../../shared/guards/backoffice-role.guard';

@Module({
  imports: [PrismaModule],
  controllers: [RolesController],
  providers: [RolesService, BackofficeRoleGuard],
  exports: [RolesService],
})
export class BackofficeRolesModule {}
