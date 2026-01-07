import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { NotificationsController } from '../../../../src/secure/notifications/controllers/notifications.controller';
import { NotificationsService } from '../../../../src/secure/notifications/services/notifications.service';
import { AuthGuard } from '../../../../src/shared/guards/auth.guard';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

  const mockUserId = 'user-123';
  const mockNotificationId = 'notification-456';

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      delete: jest.fn(),
      updatePushToken: jest.fn(),
      getPushToken: jest.fn(),
      sendTestPush: jest.fn(),
    } as unknown as jest.Mocked<NotificationsService>;

    const mockAuthGuard: CanActivate = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: service },
        { provide: AuthGuard, useValue: mockAuthGuard },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get(NotificationsController);
  });

  describe('list', () => {
    it('should delegate to service with user context', async () => {
      const query = { limit: 20, offset: 0 } as any;
      const response = {
        data: [
          { id: mockNotificationId, title: 'Test', message: 'Test notification', status: 'pending', createdAt: new Date() },
        ],
        total: 1,
        page: 1,
        limit: 20,
        unreadCount: 1,
      };
      service.list.mockResolvedValue(response);

      const result = await controller.list(mockUserId, query);

      expect(result).toEqual(response);
      expect(service.list).toHaveBeenCalledWith(mockUserId, query);
    });

    it('should return paginated notifications', async () => {
      const query = { limit: 10, offset: 0 } as any;
      const response = {
        data: [
          { id: 'notif-1', title: 'Notification 1', message: 'Message 1', status: 'pending', createdAt: new Date() },
          { id: 'notif-2', title: 'Notification 2', message: 'Message 2', status: 'read', createdAt: new Date(), readedAt: new Date() },
        ],
        total: 2,
        page: 1,
        limit: 10,
        unreadCount: 1,
      };
      service.list.mockResolvedValue(response);

      const result = await controller.list(mockUserId, query);

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.total).toEqual(2);
    });

    it('should handle empty notifications list', async () => {
      const query = { limit: 20, offset: 0 } as any;
      const response = { data: [], total: 0, page: 1, limit: 20, unreadCount: 0 };
      service.list.mockResolvedValue(response);

      const result = await controller.list(mockUserId, query);

      expect(result.data.length).toEqual(0);
      expect(result.total).toEqual(0);
    });

    it('should propagate service errors', async () => {
      const query = {} as any;
      service.list.mockRejectedValue(new Error('Failed to fetch notifications'));

      await expect(controller.list(mockUserId, query)).rejects.toThrow('Failed to fetch notifications');
    });
  });

  describe('markAsRead', () => {
    it('should delegate to service', async () => {
      const response = { success: true, message: 'Notification marked as read' };
      service.markAsRead.mockResolvedValue(response);

      const result = await controller.markAsRead(mockUserId, mockNotificationId);

      expect(result).toEqual(response);
      expect(service.markAsRead).toHaveBeenCalledWith(mockUserId, mockNotificationId);
    });

    it('should return success response', async () => {
      const response = { success: true, message: 'Notification marked as read' };
      service.markAsRead.mockResolvedValue(response);

      const result = await controller.markAsRead(mockUserId, mockNotificationId);

      expect(result.message).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should propagate service errors', async () => {
      service.markAsRead.mockRejectedValue(new Error('Notification not found'));

      await expect(controller.markAsRead(mockUserId, mockNotificationId)).rejects.toThrow('Notification not found');
    });
  });

  describe('markAllAsRead', () => {
    it('should delegate to service', async () => {
      const response = { success: true, count: 5 };
      service.markAllAsRead.mockResolvedValue(response);

      const result = await controller.markAllAsRead(mockUserId);

      expect(result).toEqual(response);
      expect(service.markAllAsRead).toHaveBeenCalledWith(mockUserId);
    });

    it('should return count of marked notifications', async () => {
      const response = { success: true, count: 10 };
      service.markAllAsRead.mockResolvedValue(response);

      const result = await controller.markAllAsRead(mockUserId);

      expect(result.count).toBeDefined();
      expect(result.count).toEqual(10);
    });

    it('should handle case with no unread notifications', async () => {
      const response = { success: true, count: 0 };
      service.markAllAsRead.mockResolvedValue(response);

      const result = await controller.markAllAsRead(mockUserId);

      expect(result.count).toEqual(0);
    });
  });

  describe('delete', () => {
    it('should delegate to service', async () => {
      const response = { success: true, message: 'Notification deleted' };
      service.delete.mockResolvedValue(response);

      const result = await controller.delete(mockUserId, mockNotificationId);

      expect(result).toEqual(response);
      expect(service.delete).toHaveBeenCalledWith(mockUserId, mockNotificationId);
    });

    it('should return success response', async () => {
      const response = { success: true, message: 'Notification deleted' };
      service.delete.mockResolvedValue(response);

      const result = await controller.delete(mockUserId, mockNotificationId);

      expect(result.message).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should propagate service errors', async () => {
      service.delete.mockRejectedValue(new Error('Notification not found'));

      await expect(controller.delete(mockUserId, mockNotificationId)).rejects.toThrow('Notification not found');
    });
  });

  describe('push token management', () => {
    it('updatePushToken should delegate to service', async () => {
      const dto = { pushToken: 'fcm_token_123', platform: 'ios' } as any;
      const response = { success: true, message: 'Push token updated' };
      service.updatePushToken.mockResolvedValue(response);

      const result = await controller.updatePushToken(mockUserId, dto);

      expect(result).toEqual(response);
      expect(service.updatePushToken).toHaveBeenCalledWith(mockUserId, dto);
    });

    it('updatePushToken should return updated token info', async () => {
      const dto = { pushToken: 'fcm_token_456', platform: 'android' } as any;
      const response = { success: true, message: 'Push token updated' };
      service.updatePushToken.mockResolvedValue(response);

      const result = await controller.updatePushToken(mockUserId, dto);

      expect(result.success).toBe(true);
    });

    it('getPushToken should delegate to service', async () => {
      const response = { pushToken: 'fcm_token_123' };
      service.getPushToken.mockResolvedValue(response);

      const result = await controller.getPushToken(mockUserId);

      expect(result).toEqual(response);
      expect(service.getPushToken).toHaveBeenCalledWith(mockUserId);
    });

    it('getPushToken should return token information', async () => {
      const response = { pushToken: 'fcm_token_789' };
      service.getPushToken.mockResolvedValue(response);

      const result = await controller.getPushToken(mockUserId);

      expect(result.pushToken).toBeDefined();
    });

    it('getPushToken should handle case with no token set', async () => {
      const response = { pushToken: null };
      service.getPushToken.mockResolvedValue(response);

      const result = await controller.getPushToken(mockUserId);

      expect(result.pushToken).toBeNull();
    });
  });

  describe('sendTestPush', () => {
    it('should delegate to service', async () => {
      const dto = { title: 'Test', message: 'Test push notification' } as any;
      const response = { message: 'Test push sent', success: true };
      service.sendTestPush.mockResolvedValue(response);

      const result = await controller.sendTestPush(mockUserId, dto);

      expect(result).toEqual(response);
      expect(service.sendTestPush).toHaveBeenCalledWith(mockUserId, dto);
    });

    it('should return success status', async () => {
      const dto = { title: 'Test', message: 'Test notification' } as any;
      const response = { message: 'Test push sent', success: true, timestamp: new Date().toISOString() };
      service.sendTestPush.mockResolvedValue(response);

      const result = await controller.sendTestPush(mockUserId, dto);

      expect(result.success).toBe(true);
    });

    it('should handle test push failure', async () => {
      const dto = { title: 'Test', message: 'Test notification' } as any;
      const response = { message: 'Failed to send test push', success: false, error: 'No push token found' };
      service.sendTestPush.mockResolvedValue(response);

      const result = await controller.sendTestPush(mockUserId, dto);

      expect(result.success).toBe(false);
    });

    it('should propagate service errors', async () => {
      const dto = { title: 'Test', message: 'Test notification' } as any;
      service.sendTestPush.mockRejectedValue(new Error('Push service unavailable'));

      await expect(controller.sendTestPush(mockUserId, dto)).rejects.toThrow('Push service unavailable');
    });
  });
});
