import { Module } from '@nestjs/common';
import { ActionsController } from './controllers/actions.controller';
import { ActionsService } from './services/actions.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [ActionsController],
  providers: [ActionsService],
  exports: [ActionsService],
})
export class BackofficeActionsModule {}
