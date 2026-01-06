import { Module } from '@nestjs/common';
import { CampaignsController } from './controllers/campaigns.controller';
import { CampaignsService } from './services/campaigns.service';
import { CampaignModel } from './models/campaign.model';
import { CampaignsMapper } from './mappers/campaigns.mapper';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignModel, CampaignsMapper],
  exports: [CampaignsService, CampaignModel, CampaignsMapper],
})
export class CampaignsModule {}
