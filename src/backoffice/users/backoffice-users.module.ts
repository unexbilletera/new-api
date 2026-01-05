import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { BackofficeUsersController } from './controllers/backoffice-users.controller';
import { BackofficeUsersService } from './services/backoffice-users.service';
import { BackofficeRoleGuard } from '../../shared/guards/backoffice-role.guard';

@Module({
  imports: [PrismaModule],
  controllers: [BackofficeUsersController],
  providers: [BackofficeUsersService, BackofficeRoleGuard],
  exports: [BackofficeUsersService],
})
export class BackofficeUsersModule {}
