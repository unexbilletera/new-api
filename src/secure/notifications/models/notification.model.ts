import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class NotificationModel {
  constructor(private prisma: PrismaService) {}

  async getNotification(notificationId: string) {
    return this.prisma.notifications.findFirst({
      where: { id: notificationId },
    });
  }

  async listNotifications(
    where: any = {},
    skip: number = 0,
    take: number = 20,
  ) {
    return this.prisma.notifications.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countNotifications(where: any = {}) {
    return this.prisma.notifications.count({ where });
  }

  async createNotification(data: any) {
    return this.prisma.notifications.create({
      data: { ...data, createdAt: new Date() },
    });
  }

  async updateNotification(notificationId: string, data: any) {
    return this.prisma.notifications.update({
      where: { id: notificationId },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notifications.update({
      where: { id: notificationId },
      data: { readedAt: new Date(), updatedAt: new Date() },
    });
  }
}
