import { Injectable } from '@nestjs/common';
import {
  NotificationResponseDto,
  ListNotificationsResponseDto,
  MarkAsReadResponseDto,
  MarkAllAsReadResponseDto,
  UpdatePushTokenResponseDto,
  GetPushTokenResponseDto,
  SendTestPushResponseDto,
  DeleteNotificationResponseDto,
} from '../dto/response';

@Injectable()
export class NotificationsMapper {
  toNotificationResponseDto(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      status: notification.status,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt,
      readedAt: notification.readedAt || undefined,
    };
  }

  toListNotificationsResponseDto(
    notifications: any[],
    total: number,
    page: number,
    limit: number,
    unreadCount: number,
  ): ListNotificationsResponseDto {
    return {
      data: notifications.map((n) => this.toNotificationResponseDto(n)),
      total,
      page,
      limit,
      unreadCount,
    };
  }

  toMarkAsReadResponseDto(
    success: boolean,
    message: string,
  ): MarkAsReadResponseDto {
    return { success, message };
  }

  toMarkAllAsReadResponseDto(
    success: boolean,
    count: number,
  ): MarkAllAsReadResponseDto {
    return { success, count };
  }

  toUpdatePushTokenResponseDto(
    success: boolean,
    message: string,
  ): UpdatePushTokenResponseDto {
    return { success, message };
  }

  toGetPushTokenResponseDto(pushToken: string | null): GetPushTokenResponseDto {
    return { pushToken };
  }

  toSendTestPushResponseDto(
    success: boolean,
    message: string,
  ): SendTestPushResponseDto {
    return { success, message };
  }

  toDeleteNotificationResponseDto(
    success: boolean,
    message: string,
  ): DeleteNotificationResponseDto {
    return { success, message };
  }
}
