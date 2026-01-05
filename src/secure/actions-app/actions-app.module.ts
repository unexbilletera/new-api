import { Module } from '@nestjs/common';
import { ActionsAppController } from './controllers/actions-app.controller';
import { ActionsAppService } from './services/actions-app.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [ActionsAppController],
  providers: [ActionsAppService],
  exports: [ActionsAppService],
})
export class ActionsAppModule {}
