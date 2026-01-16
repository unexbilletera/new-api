import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { UsersIdentitiesController } from './controllers/users-identities.controller';
import { UsersIdentitiesGrantsController } from './controllers/users-identities-grants.controller';
import { UsersAccountsController } from './controllers/users-accounts.controller';
import { UsersDataService } from './services/users-data.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    UsersIdentitiesController,
    UsersIdentitiesGrantsController,
    UsersAccountsController,
  ],
  providers: [UsersDataService],
  exports: [UsersDataService],
})
export class UsersDataModule {}
