import { Module } from '@nestjs/common';
import { AppInfoController } from './controllers/app-info.controller';
import { AppInfoService } from './services/app-info.service';
import { AppInfoModel } from './models/app-info.model';
import { AppInfoMapper } from './mappers/app-info.mapper';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [AppInfoController],
  providers: [AppInfoService, AppInfoModel, AppInfoMapper],
  exports: [AppInfoService, AppInfoModel, AppInfoMapper],
})
export class AppInfoModule {}
