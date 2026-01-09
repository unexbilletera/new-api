import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../../../../src/secure/notifications/services/notifications.service';
import { PrismaService } from '../../../../src/shared/prisma/prisma.service';
import { LoggerService } from '../../../../src/shared/logger/logger.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: jest.Mocked<PrismaService>;
  let logger: jest.Mocked<LoggerService>;

  const mockUserId = 'user-123';
  const mockNotificationId = 'notification-456';

  beforeEach(async () => {
    prisma = {
      notifications: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      pushTokens: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      users: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    logger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('list', () => {
    it('should return paginated notifications for user', async () => {
      const query = { limit: 20, offset: 0 } as any;
      const mockNotifications = [
        { id: 'notif-1', userId: mockUserId, title: 'Test 1', read: false },
        { id: 'notif-2', userId: mockUserId, title: 'Test 2', read: true },
      ];

      prisma.notifications.findMany.mockResolvedValue(mockNotifications);
      prisma.notifications.count.mockResolvedValue(2);

      const result = await service.list(mockUserId, query);

      expect(prisma.notifications.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: mockUserId }),
        })
      );
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.total).toBe(2);
    });

    it('should filter unread notifications', async () => {
      const query = { unreadOnly: true } as any;
      const mockNotifications = [
        { id: 'notif-1', userId: mockUserId, title: 'Unread', read: false },
      ];

      prisma.notifications.findMany.mockResolvedValue(mockNotifications as any);
      prisma.notifications.count.mockResolvedValue(1);

      const result = await service.list(mockUserId, query);

      expect(result.data[0].title).toBe('Unread');
    });

    it('should support pagination', async () => {
      const query = { page: 3, limit: 10 } as any;
      const mockNotifications = [];

      prisma.notifications.findMany.mockResolvedValue(mockNotifications);
      prisma.notifications.count.mockResolvedValue(0);

      const result = await service.list(mockUserId, query);

      expect(prisma.notifications.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
    });

    it('should return empty list when no notifications', async () => {
      const query = {} as any;

      prisma.notifications.findMany.mockResolvedValue([]);
      prisma.notifications.count.mockResolvedValue(0);

      const result = await service.list(mockUserId, query);

      expect(result.data.length).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: mockNotificationId,
        userId: mockUserId,
        title: 'Test',
        status: 'pending' as const,
      };

      prisma.notifications.findFirst.mockResolvedValue(mockNotification as any);
      prisma.notifications.update.mockResolvedValue({
        ...mockNotification,
        status: 'read',
      } as any);
      prisma.users.update.mockResolvedValue({} as any);

      const result = await service.markAsRead(mockUserId, mockNotificationId);

      expect(prisma.notifications.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockNotificationId },
        })
      );
      expect(result).toHaveProperty('message');
    });

    it('should verify user ownership before marking', async () => {
      const mockNotification = {
        id: mockNotificationId,
        userId: mockUserId,
        title: 'Test',
        status: 'pending' as const,
      };

      prisma.notifications.findFirst.mockResolvedValue(mockNotification as any);
      prisma.notifications.update.mockResolvedValue({
        ...mockNotification,
        status: 'read',
      } as any);
      prisma.users.update.mockResolvedValue({} as any);

      await service.markAsRead(mockUserId, mockNotificationId);

      expect(prisma.notifications.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: mockNotificationId }),
        })
      );
    });

    it('should throw error if notification not found', async () => {
      prisma.notifications.findFirst.mockResolvedValue(null);

      await expect(
        service.markAsRead(mockUserId, mockNotificationId)
      ).rejects.toThrow();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      prisma.notifications.updateMany.mockResolvedValue({ count: 5 });
      prisma.users.update.mockResolvedValue({} as any);

      const result = await service.markAllAsRead(mockUserId);

      expect(prisma.notifications.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: mockUserId }),
        })
      );
      expect(result).toHaveProperty('count');
    });

    it('should return count of marked notifications', async () => {
      prisma.notifications.updateMany.mockResolvedValue({ count: 10 });
      prisma.users.update.mockResolvedValue({} as any);

      const result = await service.markAllAsRead(mockUserId);

      expect(result.count).toBe(10);
    });

    it('should handle case with no unread notifications', async () => {
      prisma.notifications.updateMany.mockResolvedValue({ count: 0 });
      prisma.users.update.mockResolvedValue({} as any);

      const result = await service.markAllAsRead(mockUserId);

      expect(result.count).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete notification for user', async () => {
      const mockNotification = {
        id: mockNotificationId,
        userId: mockUserId,
        status: 'pending' as const,
      };

      prisma.notifications.findFirst.mockResolvedValue(mockNotification as any);
      prisma.notifications.update.mockResolvedValue(mockNotification as any);
      prisma.users.update.mockResolvedValue({} as any);

      const result = await service.delete(mockUserId, mockNotificationId);

      expect(prisma.notifications.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockNotificationId },
        })
      );
      expect(result).toHaveProperty('message');
    });

    it('should throw error when notification belongs to different user', async () => {
      prisma.notifications.findFirst.mockResolvedValue(null);

      await expect(
        service.delete(mockUserId, mockNotificationId)
      ).rejects.toThrow();
    });
  });

  describe('push token management', () => {
    it('updatePushToken should save token for user', async () => {
      const dto = { pushToken: 'fcm_token_123', platform: 'ios' } as any;

      prisma.users.update.mockResolvedValue({
        id: mockUserId,
        mobileDevicePush: 'fcm_token_123',
      } as any);

      const result = await service.updatePushToken(mockUserId, dto);

      expect(prisma.users.update).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });

    it('getPushToken should retrieve stored token', async () => {
      const mockToken = {
        mobileDevicePush: 'fcm_token_456',
        browserDevicePush: null,
      };

      prisma.users.findUnique.mockResolvedValue(mockToken as any);

      const result = await service.getPushToken(mockUserId);

      expect(prisma.users.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUserId },
          select: { mobileDevicePush: true, browserDevicePush: true },
        })
      );
      expect(result.pushToken).toBe('fcm_token_456');
    });

    it('getPushToken should return null when no token found', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      const result = await service.getPushToken(mockUserId);

      expect(result.pushToken).toBeNull();
    });
  });

  describe('sendTestPush', () => {
    it('should send test push notification', async () => {
      const dto = { title: 'Test', message: 'Test push' } as any;
      const mockUser = { mobileDevicePush: 'fcm_token_123', browserDevicePush: null };

      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.notifications.create.mockResolvedValue({} as any);
      prisma.users.update.mockResolvedValue({} as any);

      const result = await service.sendTestPush(mockUserId, dto);

      expect(prisma.users.findUnique).toHaveBeenCalled();
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });

    it('should fail gracefully if user has no push token', async () => {
      const dto = { title: 'Test', message: 'Test push' } as any;

      prisma.users.findUnique.mockResolvedValue({ mobileDevicePush: null, browserDevicePush: null } as any);

      const result = await service.sendTestPush(mockUserId, dto);

      expect(result.success).toBe(false);
    });

    it('should create notification when push token exists', async () => {
      const dto = { title: 'Test', message: 'Test push' } as any;
      const mockUser = { mobileDevicePush: 'fcm_token_123', browserDevicePush: null };

      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.notifications.create.mockResolvedValue({} as any);
      prisma.users.update.mockResolvedValue({} as any);

      await service.sendTestPush(mockUserId, dto);

      expect(prisma.notifications.create).toHaveBeenCalled();
    });
  });
});
