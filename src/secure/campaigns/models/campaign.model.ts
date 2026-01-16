import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class CampaignModel {
  constructor(private prisma: PrismaService) {}

  async getCampaign(campaignId: string) {
    return this.prisma.campaign_codes.findFirst({
      where: { id: campaignId },
    });
  }

  async listCampaigns(where: any = {}, skip: number = 0, take: number = 20) {
    return this.prisma.campaign_codes.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countCampaigns(where: any = {}) {
    return this.prisma.campaign_codes.count({ where });
  }

  async createCampaign(data: any) {
    return this.prisma.campaign_codes.create({
      data: { ...data, createdAt: new Date(), updatedAt: new Date() },
    });
  }

  async updateCampaign(campaignId: string, data: any) {
    return this.prisma.campaign_codes.update({
      where: { id: campaignId },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async deleteCampaign(campaignId: string) {
    return this.prisma.campaign_codes.update({
      where: { id: campaignId },
      data: { deletedAt: new Date() },
    });
  }
}
