import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class ActionsAppModel {
  constructor(private prisma: PrismaService) {}

  async getAction(actionId: string) {
    return this.prisma.home_actions.findFirst({
      where: { id: actionId },
    });
  }

  async listActions(where: any = {}, skip: number = 0, take: number = 20) {
    return this.prisma.home_actions.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countActions(where: any = {}) {
    return this.prisma.home_actions.count({ where });
  }

  async createAction(data: any) {
    return this.prisma.home_actions.create({
      data: { ...data, createdAt: new Date(), updatedAt: new Date() },
    });
  }

  async updateAction(actionId: string, data: any) {
    return this.prisma.home_actions.update({
      where: { id: actionId },
      data: { ...data, updatedAt: new Date() },
    });
  }
}
