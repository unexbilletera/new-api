import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class CampaignModel {
  constructor(private prisma: PrismaService) {}

  async getCampaign(campaignId: string) {
    return this.prisma.campaigns.findUnique({
      where: { id: campaignId },
    });
  }

  async listCampaigns(where: any = {}, skip: number = 0, take: number = 20) {
    return this.prisma.campaigns.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countCampaigns(where: any = {}) {
    return this.prisma.campaigns.count({ where });
  }

  async createCampaign(data: any) {
    return this.prisma.campaigns.create({
      data: { ...data, createdAt: new Date(), updatedAt: new Date() },
    });
  }

  async updateCampaign(campaignId: string, data: any) {
    return this.prisma.campaigns.update({
      where: { id: campaignId },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async deleteCampaign(campaignId: string) {
    return this.prisma.campaigns.delete({
      where: { id: campaignId },
    });
  }
}
