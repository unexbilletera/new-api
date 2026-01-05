import { Module } from '@nestjs/common';
import { CampaignsController } from './controllers/campaigns.controller';
import { CampaignsService } from './services/campaigns.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
