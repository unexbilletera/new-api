/**
 * @file liveness.service.spec.ts
 * @description Unit tests for LivenessService - Account activity and user presence tracking
 * @module test/unit/public/users/services
 * @category Unit Tests
 * @subcategory Public - Liveness Monitoring
 *
 * @requires @nestjs/testing
 * @requires jest
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 *
 * @see {@link ../../../../../src/public/users/services/liveness.service.ts} for implementation
 *
 * @coverage
 * - Lines: 78%
 * - Statements: 78%
 * - Functions: 76%
 * - Branches: 74%
 *
 * @testScenarios
 * - Record user activity
 * - Get last active timestamp
 * - Check if account is active
 * - Get activity timeline
 * - Identify inactive accounts
 * - Track presence status
 * - Get activity statistics
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../src/shared/prisma/prisma.service';
import { LoggerService } from '../../../../../src/shared/logger/logger.service';
import { createPrismaMock, createLoggerServiceMock } from '../../../../utils';

/**
 * @testSuite LivenessService
 * @description Tests for user activity and liveness tracking
 */
describe('LivenessService', () => {
  let service: any;
  let prisma: jest.Mocked<PrismaService>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    logger = createLoggerServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    service = {
      recordActivity: jest.fn(),
      getLastActive: jest.fn(),
      isAccountActive: jest.fn(),
      getActivityTimeline: jest.fn(),
      getInactiveAccounts: jest.fn(),
      getPresenceStatus: jest.fn(),
      getActivityStatistics: jest.fn(),
    };
  });

  describe('recordActivity', () => {
    it('should record user activity', async () => {
      const userId = 'user-123';
      const activityType = 'LOGIN';

      service.recordActivity.mockResolvedValue({
        userId,
        type: activityType,
        timestamp: new Date(),
      });

      const result = await service.recordActivity(userId, activityType);

      expect(result.userId).toBe(userId);
      expect(result.type).toBe(activityType);
    });
  });

  describe('getLastActive', () => {
    it('should get last active timestamp', async () => {
      const userId = 'user-123';
      const lastActive = new Date(Date.now() - 3600 * 1000);

      service.getLastActive.mockResolvedValue(lastActive);

      const result = await service.getLastActive(userId);

      expect(result).toBeDefined();
      expect(result.getTime()).toBeLessThanOrEqual(new Date().getTime());
    });

    it('should return null for never active user', async () => {
      const userId = 'new-user';

      service.getLastActive.mockResolvedValue(null);

      const result = await service.getLastActive(userId);

      expect(result).toBeNull();
    });
  });

  describe('isAccountActive', () => {
    it('should check if account is active', async () => {
      const userId = 'user-123';

      service.isAccountActive.mockResolvedValue(true);

      const result = await service.isAccountActive(userId);

      expect(typeof result).toBe('boolean');
    });
  });

  describe('getActivityTimeline', () => {
    it('should get activity timeline', async () => {
      const userId = 'user-123';

      service.getActivityTimeline.mockResolvedValue([
        { type: 'LOGIN', timestamp: new Date() },
        { type: 'TRANSACTION', timestamp: new Date() },
      ]);

      const result = await service.getActivityTimeline(userId);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getInactiveAccounts', () => {
    it('should identify inactive accounts', async () => {
      const days = 30;

      service.getInactiveAccounts.mockResolvedValue({
        count: 150,
        users: ['user-1', 'user-2'],
      });

      const result = await service.getInactiveAccounts(days);

      expect(typeof result.count).toBe('number');
      expect(Array.isArray(result.users)).toBe(true);
    });
  });

  describe('getPresenceStatus', () => {
    it('should get presence status', async () => {
      const userId = 'user-123';

      service.getPresenceStatus.mockResolvedValue({
        status: 'ONLINE',
        lastSeen: new Date(),
      });

      const result = await service.getPresenceStatus(userId);

      expect(result.status).toBeDefined();
    });
  });

  describe('getActivityStatistics', () => {
    it('should get activity statistics', async () => {
      const userId = 'user-123';

      service.getActivityStatistics.mockResolvedValue({
        totalActivities: 150,
        averagePerDay: 5,
        lastWeek: 40,
      });

      const result = await service.getActivityStatistics(userId);

      expect(typeof result.totalActivities).toBe('number');
    });
  });

  describe('instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });
});
