export class NotificationResponseDto {
  id: string;
  status: string;
  title?: string;
  message?: string;
  createdAt: Date;
  readedAt?: Date;
}

export class ListNotificationsResponseDto {
  data: NotificationResponseDto[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

export class MarkAsReadResponseDto {
  success: boolean;
  message: string;
}

export class MarkAllAsReadResponseDto {
  success: boolean;
  count: number;
}

export class UpdatePushTokenResponseDto {
  success: boolean;
  message: string;
}

export class GetPushTokenResponseDto {
  pushToken: string | null;
}

export class SendTestPushResponseDto {
  success: boolean;
  message: string;
}

export class DeleteNotificationResponseDto {
  success: boolean;
  message: string;
}
