import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class AppInfoModel {
  constructor(private prisma: PrismaService) {}

  async getAppInfo(appId: string) {
    return this.prisma.app_info.findUnique({
      where: { id: appId },
    });
  }

  async listAppInfo(where: any = {}) {
    return this.prisma.app_info.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAppInfo(data: any) {
    return this.prisma.app_info.create({
      data: { ...data, createdAt: new Date(), updatedAt: new Date() },
    });
  }

  async updateAppInfo(appId: string, data: any) {
    return this.prisma.app_info.update({
      where: { id: appId },
      data: { ...data, updatedAt: new Date() },
    });
  }
}
