import { Module } from '@nestjs/common';
import { AppInfoController } from './controllers/app-info.controller';
import { AppInfoService } from './services/app-info.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [AppInfoController],
  providers: [AppInfoService],
  exports: [AppInfoService],
})
export class AppInfoModule {}
