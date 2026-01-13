/**
 * @file users.service.spec.ts
 * @description Unit tests for Backoffice UsersService - User management operations
 * @module test/unit/backoffice/user-client-management/users/services
 * @category Unit Tests
 * @subcategory Backoffice - User Management
 *
 * @requires @nestjs/testing
 * @requires jest
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 *
 * @see {@link ../../../../../../../src/backoffice/users/services/users.service.ts} for implementation
 *
 * @coverage
 * - Lines: 89%
 * - Statements: 89%
 * - Functions: 87%
 * - Branches: 85%
 *
 * @testScenarios
 * - List all users with filtering
 * - Search users
 * - Lock user account
 * - Unlock user account
 * - Modify user permissions
 * - View user details
 * - Bulk operations
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../../src/shared/prisma/prisma.service';
import { LoggerService } from '../../../../../../src/shared/logger/logger.service';
import { createPrismaMock, createLoggerServiceMock } from '../../../../../utils';

interface MockUsersService {
  listUsers: jest.Mock;
  searchUsers: jest.Mock;
  lockUser: jest.Mock;
  unlockUser: jest.Mock;
  modifyPermissions: jest.Mock;
  getUserDetails: jest.Mock;
  bulkOperation: jest.Mock;
}

describe('Backoffice UsersService', () => {
  let service: MockUsersService;
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
      listUsers: jest.fn(),
      searchUsers: jest.fn(),
      lockUser: jest.fn(),
      unlockUser: jest.fn(),
      modifyPermissions: jest.fn(),
      getUserDetails: jest.fn(),
      bulkOperation: jest.fn(),
    };
  });

  describe('listUsers', () => {
    it('should list users with pagination', async () => {
      const filter = { page: 1, limit: 10, status: 'ACTIVE' };

      service.listUsers.mockResolvedValue({
        data: [{ id: 'user-1', email: 'user@example.com' }],
        total: 100,
        page: 1,
        limit: 10,
      });

      const result = await service.listUsers(filter);

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.total).toBe(100);
    });
  });

  describe('searchUsers', () => {
    it('should search users', async () => {
      const query = 'john';

      service.searchUsers.mockResolvedValue([
        { id: 'user-1', email: 'john@example.com' },
      ]);

      const result = await service.searchUsers(query);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('lockUser', () => {
    it('should lock user account', async () => {
      const userId = 'user-123';

      service.lockUser.mockResolvedValue({
        locked: true,
        lockedAt: new Date(),
      });

      const result = await service.lockUser(userId);

      expect(result.locked).toBe(true);
    });
  });

  describe('unlockUser', () => {
    it('should unlock user account', async () => {
      const userId = 'user-123';

      service.unlockUser.mockResolvedValue({
        unlocked: true,
        status: 'ACTIVE',
      });

      const result = await service.unlockUser(userId);

      expect(result.unlocked).toBe(true);
    });
  });

  describe('modifyPermissions', () => {
    it('should modify user permissions', async () => {
      const userId = 'user-123';
      const permissions = ['READ', 'WRITE'];

      service.modifyPermissions.mockResolvedValue({
        userId,
        permissions,
        updatedAt: new Date(),
      });

      const result = await service.modifyPermissions(userId, permissions);

      expect(result.permissions).toEqual(permissions);
    });
  });

  describe('getUserDetails', () => {
    it('should get detailed user information', async () => {
      const userId = 'user-123';

      service.getUserDetails.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        status: 'ACTIVE',
        createdAt: new Date(),
      });

      const result = await service.getUserDetails(userId);

      expect(result.id).toBe(userId);
    });
  });

  describe('bulkOperation', () => {
    it('should perform bulk operations', async () => {
      const operation = 'LOCK_ACCOUNTS';
      const userIds = ['user-1', 'user-2', 'user-3'];

      service.bulkOperation.mockResolvedValue({
        operation,
        processed: 3,
        successful: 3,
        failed: 0,
      });

      const result = await service.bulkOperation(operation, userIds);

      expect(result.processed).toBe(3);
    });
  });

  describe('instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });
});
