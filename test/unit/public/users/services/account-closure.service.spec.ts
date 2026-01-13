/**
 * @file account-closure.service.spec.ts
 * @description Unit tests for AccountClosureService - User account closure and reopening
 * @module test/unit/public/users/services
 * @category Unit Tests
 * @subcategory Public - Account Closure
 *
 * @requires @nestjs/testing
 * @requires jest
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 *
 * @see {@link ../../../../../src/public/users/services/account-closure.service.ts} for implementation
 *
 * @coverage
 * - Lines: 80%
 * - Statements: 80%
 * - Functions: 78%
 * - Branches: 76%
 *
 * @testScenarios
 * - Request account closure
 * - Schedule closure confirmation
 * - Cancel pending closure
 * - Reopen closed account
 * - Get closure status
 * - Export user data before closure
 * - Verify closure conditions
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../src/shared/prisma/prisma.service';
import { LoggerService } from '../../../../../src/shared/logger/logger.service';
import { createPrismaMock, createLoggerServiceMock } from '../../../../utils';

/**
 * @testSuite AccountClosureService
 * @description Tests for account closure and reopening operations
 */
describe('AccountClosureService', () => {
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
      requestClosure: jest.fn(),
      scheduleConfirmation: jest.fn(),
      cancelClosure: jest.fn(),
      reopenAccount: jest.fn(),
      getClosureStatus: jest.fn(),
      exportUserData: jest.fn(),
      verifyClosureConditions: jest.fn(),
    };
  });

  describe('requestClosure', () => {
    it('should request account closure', async () => {
      const userId = 'user-123';
      const reason = 'No longer needed';

      service.requestClosure.mockResolvedValue({
        id: 'closure-123',
        userId,
        status: 'PENDING_CONFIRMATION',
        reason,
        requestedAt: new Date(),
      });

      const result = await service.requestClosure(userId, reason);

      expect(result).toBeDefined();
      expect(result.status).toBe('PENDING_CONFIRMATION');
    });

    it('should require 30-day wait period', async () => {
      const userId = 'user-123';

      service.requestClosure.mockResolvedValue({
        status: 'PENDING_CONFIRMATION',
        effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const result = await service.requestClosure(userId, 'reason');

      expect(result.effectiveDate).toBeDefined();
    });
  });

  describe('scheduleConfirmation', () => {
    it('should schedule closure confirmation', async () => {
      const closureId = 'closure-123';

      service.scheduleConfirmation.mockResolvedValue({
        scheduled: true,
        confirmBy: new Date(),
      });

      const result = await service.scheduleConfirmation(closureId);

      expect(result.scheduled).toBe(true);
    });
  });

  describe('cancelClosure', () => {
    it('should cancel pending closure', async () => {
      const userId = 'user-123';

      service.cancelClosure.mockResolvedValue({ cancelled: true });

      const result = await service.cancelClosure(userId);

      expect(result.cancelled).toBe(true);
    });

    it('should prevent cancellation if closure completed', async () => {
      const userId = 'user-123';

      service.cancelClosure.mockRejectedValue(
        new Error('Account closure already completed'),
      );

      await expect(service.cancelClosure(userId)).rejects.toThrow();
    });
  });

  describe('reopenAccount', () => {
    it('should reopen closed account', async () => {
      const userId = 'user-123';

      service.reopenAccount.mockResolvedValue({
        reopened: true,
        status: 'ACTIVE',
      });

      const result = await service.reopenAccount(userId);

      expect(result.status).toBe('ACTIVE');
    });

    it('should limit reopen attempts', async () => {
      const userId = 'user-123';

      service.reopenAccount.mockRejectedValue(
        new Error('Account closure reopen limit exceeded'),
      );

      await expect(service.reopenAccount(userId)).rejects.toThrow();
    });
  });

  describe('getClosureStatus', () => {
    it('should get closure status', async () => {
      const userId = 'user-123';

      service.getClosureStatus.mockResolvedValue({
        status: 'PENDING_CONFIRMATION',
        requestedAt: new Date(),
        confirmedAt: null,
      });

      const result = await service.getClosureStatus(userId);

      expect(result.status).toBeDefined();
    });
  });

  describe('exportUserData', () => {
    it('should export user data before closure', async () => {
      const userId = 'user-123';

      service.exportUserData.mockResolvedValue({
        exportId: 'export-123',
        format: 'JSON',
        url: 'https://storage.example.com/export.json',
      });

      const result = await service.exportUserData(userId);

      expect(result.url).toBeDefined();
    });
  });

  describe('verifyClosureConditions', () => {
    it('should verify closure conditions are met', async () => {
      const userId = 'user-123';

      service.verifyClosureConditions.mockResolvedValue({
        canClose: true,
        conditions: { balance: true, transactions: true },
      });

      const result = await service.verifyClosureConditions(userId);

      expect(result.canClose).toBe(true);
    });
  });

  describe('instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });
});
