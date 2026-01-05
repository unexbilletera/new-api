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
  constructor(private prisma: PrismaService) {}  async list(userId: string, query: ListNotificationsQueryDto): Promise<{
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
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        readedAt: n.readedAt,
      })),
      total,
      page,
      limit,
      unreadCount,
    };
  }  async markAsRead(userId: string, notificationId: string): Promise<{ success: boolean; message: string }> {
    const notification = await this.prisma.notifications.findFirst({
      where: { id: notificationId, userId, deletedAt: null },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }

    if (notification.status === 'read') {
      return { success: true, message: 'Notificação já estava marcada como lida' };
    }

    await this.prisma.notifications.update({
      where: { id: notificationId },
      data: {
        status: 'read',
        readedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        unreadNotifications: { decrement: 1 },
      },
    });

    return { success: true, message: 'Notificação marcada como lida' };
  }  async markAllAsRead(userId: string): Promise<{ success: boolean; count: number }> {
    const result = await this.prisma.notifications.updateMany({
      where: { userId, status: 'pending', deletedAt: null },
      data: {
        status: 'read',
        readedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.prisma.users.update({
      where: { id: userId },
      data: { unreadNotifications: 0 },
    });

    return { success: true, count: result.count };
  }  async updatePushToken(userId: string, dto: UpdatePushTokenDto): Promise<{ success: boolean; message: string }> {
    await this.prisma.users.update({
      where: { id: userId },
      data: {
        pushToken: dto.pushToken,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Push token atualizado com sucesso' };
  }  async getPushToken(userId: string): Promise<{ pushToken: string | null }> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });

    return { pushToken: user?.pushToken || null };
  }  async sendTestPush(userId: string, dto: TestPushDto): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });

    if (!user?.pushToken) {
      return { success: false, message: 'Usuário não possui push token configurado' };
    }

    await this.prisma.notifications.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        status: 'pending',
        title: dto.title || 'Notificação de Teste',
        message: dto.message || 'Esta é uma notificação de teste',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        unreadNotifications: { increment: 1 },
      },
    });

    return { success: true, message: 'Notificação de teste enviada' };
  }  async delete(userId: string, notificationId: string): Promise<{ success: boolean; message: string }> {
    const notification = await this.prisma.notifications.findFirst({
      where: { id: notificationId, userId, deletedAt: null },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }

    await this.prisma.notifications.update({
      where: { id: notificationId },
      data: { deletedAt: new Date() },
    });

    if (notification.status === 'pending') {
      await this.prisma.users.update({
        where: { id: userId },
        data: {
          unreadNotifications: { decrement: 1 },
        },
      });
    }

    return { success: true, message: 'Notificação deletada' };
  }
}
