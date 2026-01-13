import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  CampaignCodeResponseDto,
  CampaignValidationResponseDto,
  UseCampaignResponseDto,
} from '../dto/campaigns.dto';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async validateCode(
    userId: string,
    code: string,
  ): Promise<CampaignValidationResponseDto> {
    const campaign = await this.prisma.campaign_codes.findFirst({
      where: {
        code: code.toUpperCase(),
        deletedAt: null,
      },
    });

    if (!campaign) {
      return {
        valid: false,
        message: 'Campaign code not found',
      };
    }

    if (!campaign.isActive) {
      return {
        valid: false,
        message: 'This campaign is not active',
      };
    }

    const now = new Date();
    if (campaign.validFrom && new Date(campaign.validFrom) > now) {
      return {
        valid: false,
        message: 'This campaign has not started yet',
      };
    }

    if (campaign.validTo && new Date(campaign.validTo) < now) {
      return {
        valid: false,
        message: 'This campaign has already expired',
      };
    }

    const userUsage = await this.prisma.user_campaign_codes.findFirst({
      where: {
        userId,
        campaignCodeId: campaign.id,
      },
    });

    const campaignResponse: CampaignCodeResponseDto = {
      id: campaign.id,
      code: campaign.code,
      name: campaign.name,
      description: campaign.description || undefined,
      discountType: undefined,
      discountValue: undefined,
      minAmount: undefined,
      maxUses: undefined,
      currentUses: 0,
      startDate: campaign.validFrom || undefined,
      endDate: campaign.validTo || undefined,
      active: campaign.isActive,
    };

    if (userUsage) {
      return {
        valid: true,
        message: 'Valid code, but you have already used this campaign',
        campaign: campaignResponse,
        alreadyUsed: true,
      };
    }

    return {
      valid: true,
      message: 'Valid campaign code',
      campaign: campaignResponse,
      alreadyUsed: false,
    };
  }

  async useCode(
    userId: string,
    code: string,
    transactionId?: string,
  ): Promise<UseCampaignResponseDto> {
    const validation = await this.validateCode(userId, code);

    if (!validation.valid) {
      return {
        success: false,
        message: validation.message,
      };
    }

    if (validation.alreadyUsed) {
      return {
        success: false,
        message: 'You have already used this campaign code',
      };
    }

    const campaign = await this.prisma.campaign_codes.findUnique({
      where: { id: validation.campaign!.id },
    });

    if (!campaign) {
      return {
        success: false,
        message: 'Campaign not found',
      };
    }

    const usage = await this.prisma.user_campaign_codes.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        campaignCodeId: validation.campaign!.id,
        code: campaign.code,
        createdAt: new Date(),
      },
    });

    await this.prisma.campaign_codes.update({
      where: { id: validation.campaign!.id },
      data: {
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Campaign code applied successfully',
      usageId: usage.id,
    };
  }

  async listUserCampaigns(userId: string): Promise<{
    used: CampaignCodeResponseDto[];
  }> {
    const usages = await this.prisma.user_campaign_codes.findMany({
      where: { userId },
      include: {
        campaign_codes: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const used = usages
      .filter((u) => u.campaign_codes)
      .map((u) => ({
        id: u.campaign_codes.id,
        code: u.campaign_codes.code,
        name: u.campaign_codes.name,
        description: u.campaign_codes.description || undefined,
        discountType: undefined,
        discountValue: undefined,
        minAmount: undefined,
        maxUses: undefined,
        currentUses: 0,
        startDate: u.campaign_codes.validFrom || undefined,
        endDate: u.campaign_codes.validTo || undefined,
        active: u.campaign_codes.isActive,
      }));

    return { used };
  }
}
