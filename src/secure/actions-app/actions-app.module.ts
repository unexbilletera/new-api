import { Module } from '@nestjs/common';
import { ActionsAppController } from './controllers/actions-app.controller';
import { ActionsAppService } from './services/actions-app.service';
import { ActionsAppModel } from './models/actions-app.model';
import { ActionsAppMapper } from './mappers/actions-app.mapper';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [ActionsAppController],
  providers: [ActionsAppService, ActionsAppModel, ActionsAppMapper],
  exports: [ActionsAppService, ActionsAppModel, ActionsAppMapper],
})
export class ActionsAppModule {}
