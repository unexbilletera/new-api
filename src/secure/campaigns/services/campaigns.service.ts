import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  CampaignCodeResponseDto,
  CampaignValidationResponseDto,
  UseCampaignResponseDto,
} from '../dto/campaigns.dto';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}  async validateCode(userId: string, code: string): Promise<CampaignValidationResponseDto> {

    const campaign = await this.prisma.campaign_codes.findFirst({
      where: {
        code: code.toUpperCase(),
        deletedAt: null,
      },
    });

    if (!campaign) {
      return {
        valid: false,
        message: 'Código de campanha não encontrado',
      };
    }

    if (!campaign.active) {
      return {
        valid: false,
        message: 'Esta campanha não está ativa',
      };
    }

    const now = new Date();
    if (campaign.startDate && new Date(campaign.startDate) > now) {
      return {
        valid: false,
        message: 'Esta campanha ainda não começou',
      };
    }

    if (campaign.endDate && new Date(campaign.endDate) < now) {
      return {
        valid: false,
        message: 'Esta campanha já expirou',
      };
    }

    if (campaign.maxUses && campaign.currentUses >= campaign.maxUses) {
      return {
        valid: false,
        message: 'Esta campanha atingiu o limite máximo de usos',
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
      discountType: campaign.discountType || undefined,
      discountValue: campaign.discountValue ? Number(campaign.discountValue) : undefined,
      minAmount: campaign.minAmount ? Number(campaign.minAmount) : undefined,
      maxUses: campaign.maxUses || undefined,
      currentUses: campaign.currentUses || 0,
      startDate: campaign.startDate || undefined,
      endDate: campaign.endDate || undefined,
      active: campaign.active,
    };

    if (userUsage) {
      return {
        valid: true,
        message: 'Código válido, mas você já utilizou esta campanha',
        campaign: campaignResponse,
        alreadyUsed: true,
      };
    }

    return {
      valid: true,
      message: 'Código de campanha válido',
      campaign: campaignResponse,
      alreadyUsed: false,
    };
  }  async useCode(
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
        message: 'Você já utilizou este código de campanha',
      };
    }

    const usage = await this.prisma.user_campaign_codes.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        campaignCodeId: validation.campaign!.id,
        transactionId: transactionId || null,
        usedAt: new Date(),
        createdAt: new Date(),
      },
    });

    await this.prisma.campaign_codes.update({
      where: { id: validation.campaign!.id },
      data: {
        currentUses: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Código de campanha aplicado com sucesso',
      usageId: usage.id,
    };
  }  async listUserCampaigns(userId: string): Promise<{
    used: CampaignCodeResponseDto[];
  }> {
    const usages = await this.prisma.user_campaign_codes.findMany({
      where: { userId },
      include: {
        campaign_codes: true,
      },
      orderBy: { usedAt: 'desc' },
    });

    const used = usages
      .filter((u) => u.campaign_codes)
      .map((u) => ({
        id: u.campaign_codes.id,
        code: u.campaign_codes.code,
        name: u.campaign_codes.name,
        description: u.campaign_codes.description || undefined,
        discountType: u.campaign_codes.discountType || undefined,
        discountValue: u.campaign_codes.discountValue
          ? Number(u.campaign_codes.discountValue)
          : undefined,
        minAmount: u.campaign_codes.minAmount
          ? Number(u.campaign_codes.minAmount)
          : undefined,
        maxUses: u.campaign_codes.maxUses || undefined,
        currentUses: u.campaign_codes.currentUses || 0,
        startDate: u.campaign_codes.startDate || undefined,
        endDate: u.campaign_codes.endDate || undefined,
        active: u.campaign_codes.active,
        usedAt: u.usedAt,
      }));

    return { used };
  }
}
