import { Injectable } from '@nestjs/common';
import {
  CampaignCodeResponseDto,
  CampaignValidationResponseDto,
  UseCampaignResponseDto,
  ListUserCampaignsResponseDto,
} from '../dto/response';

@Injectable()
export class CampaignsMapper {
  toCampaignCodeResponseDto(campaign: any): CampaignCodeResponseDto {
    return {
      id: campaign.id,
      code: campaign.code,
      name: campaign.name,
      description: campaign.description || undefined,
      discountType: campaign.discountType || undefined,
      discountValue: campaign.discountValue
        ? Number(campaign.discountValue)
        : undefined,
      minAmount: campaign.minAmount ? Number(campaign.minAmount) : undefined,
      maxUses: campaign.maxUses || undefined,
      currentUses: campaign.currentUses || 0,
      startDate: campaign.startDate || undefined,
      endDate: campaign.endDate || undefined,
      active: campaign.active,
    };
  }

  toCampaignValidationResponseDto(
    valid: boolean,
    message: string,
    campaign?: CampaignCodeResponseDto,
    alreadyUsed?: boolean,
  ): CampaignValidationResponseDto {
    return {
      valid,
      message,
      campaign,
      alreadyUsed,
    };
  }

  toUseCampaignResponseDto(
    success: boolean,
    message: string,
    usageId?: string,
  ): UseCampaignResponseDto {
    return {
      success,
      message,
      usageId,
    };
  }

  toListUserCampaignsResponseDto(
    campaigns: CampaignCodeResponseDto[],
  ): ListUserCampaignsResponseDto {
    return { used: campaigns };
  }
}
