import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class ActionsAppModel {
  constructor(private prisma: PrismaService) {}

  async getAction(actionId: string) {
    return this.prisma.actions_app.findUnique({
      where: { id: actionId },
    });
  }

  async listActions(where: any = {}, skip: number = 0, take: number = 20) {
    return this.prisma.actions_app.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countActions(where: any = {}) {
    return this.prisma.actions_app.count({ where });
  }

  async createAction(data: any) {
    return this.prisma.actions_app.create({
      data: { ...data, createdAt: new Date(), updatedAt: new Date() },
    });
  }

  async updateAction(actionId: string, data: any) {
    return this.prisma.actions_app.update({
      where: { id: actionId },
      data: { ...data, updatedAt: new Date() },
    });
  }
}
