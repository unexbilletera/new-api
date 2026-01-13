import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  ListNotificationsQueryDto,
  UpdatePushTokenDto,
  TestPushDto,
  NotificationResponseDto,
} from '../dto/notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async list(
    userId: string,
    query: ListNotificationsQueryDto,
  ): Promise<{
    data: NotificationResponseDto[];
    total: number;
    page: number;
    limit: number;
    unreadCount: number;
  }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notifications.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notifications.count({ where }),
      this.prisma.notifications.count({
        where: { userId, deletedAt: null, status: 'pending' },
      }),
    ]);

    return {
      data: data.map((n) => ({
        id: n.id,
        status: n.status,
        title: n.title || undefined,
        message: n.message || undefined,
        createdAt: n.createdAt,
        readedAt: n.readedAt || undefined,
      })),
      total,
      page,
      limit,
      unreadCount,
    };
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<{ success: boolean; message: string }> {
    const notification = await this.prisma.notifications.findFirst({
      where: { id: notificationId, userId, deletedAt: null },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.status === 'readed') {
      return {
        success: true,
        message: 'Notification was already marked as read',
      };
    }

    await this.prisma.notifications.update({
      where: { id: notificationId },
      data: {
        status: 'readed',
        readedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Notification marked as read' };
  }

  async markAllAsRead(
    userId: string,
  ): Promise<{ success: boolean; count: number }> {
    const result = await this.prisma.notifications.updateMany({
      where: { userId, status: 'pending', deletedAt: null },
      data: {
        status: 'readed',
        readedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { success: true, count: result.count };
  }

  async updatePushToken(
    userId: string,
    dto: UpdatePushTokenDto,
  ): Promise<{ success: boolean; message: string }> {
    const platform = dto.platform || 'mobile';
    const pushField =
      platform === 'ios' || platform === 'android'
        ? 'mobileDevicePush'
        : 'browserDevicePush';

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        [pushField]: dto.pushToken,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Push token updated successfully' };
  }

  async getPushToken(userId: string): Promise<{ pushToken: string | null }> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { mobileDevicePush: true, browserDevicePush: true },
    });

    return {
      pushToken: user?.mobileDevicePush || user?.browserDevicePush || null,
    };
  }

  async sendTestPush(
    userId: string,
    dto: TestPushDto,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { mobileDevicePush: true, browserDevicePush: true },
    });

    if (!user?.mobileDevicePush && !user?.browserDevicePush) {
      return {
        success: false,
        message: 'User does not have a configured push token',
      };
    }

    await this.prisma.notifications.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        status: 'pending',
        title: dto.title || 'Test Notification',
        message: dto.message || 'This is a test notification',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Test notification sent' };
  }

  async delete(
    userId: string,
    notificationId: string,
  ): Promise<{ success: boolean; message: string }> {
    const notification = await this.prisma.notifications.findFirst({
      where: { id: notificationId, userId, deletedAt: null },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notifications.update({
      where: { id: notificationId },
      data: { deletedAt: new Date() },
    });

    return { success: true, message: 'Notification deleted' };
  }
}
