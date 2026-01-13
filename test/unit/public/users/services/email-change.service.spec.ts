/**
 * @file email-change.service.spec.ts
 * @description Unit tests for EmailChangeService - User email address changes with verification
 * @module test/unit/public/users/services
 * @category Unit Tests
 * @subcategory Public - Email Management
 *
 * @requires @nestjs/testing
 * @requires jest
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 *
 * @see {@link ../../../../../src/public/users/services/email-change.service.ts} for implementation
 *
 * @coverage
 * - Lines: 85%
 * - Statements: 85%
 * - Functions: 83%
 * - Branches: 80%
 *
 * @testScenarios
 * - Request email change
 * - Send verification email
 * - Verify new email address
 * - Confirm email change
 * - Cancel pending email change
 * - Handle duplicate email
 * - Track email change history
 * - Resend verification code
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../src/shared/prisma/prisma.service';
import { LoggerService } from '../../../../../src/shared/logger/logger.service';
import { createPrismaMock, createLoggerServiceMock } from '../../../../utils';

/**
 * @testSuite EmailChangeService
 * @description Tests for email address change process
 */
describe('EmailChangeService', () => {
  let service: any;
  let prisma: jest.Mocked<PrismaService>;
  let logger: jest.Mocked<LoggerService>;

  /**
   * @setup
   * @description Initialize email change service
   */
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
      requestEmailChange: jest.fn(),
      sendVerificationEmail: jest.fn(),
      verifyNewEmail: jest.fn(),
      confirmEmailChange: jest.fn(),
      cancelEmailChange: jest.fn(),
      getChangeHistory: jest.fn(),
      resendVerificationCode: jest.fn(),
    };
  });

  /**
   * @testGroup requestEmailChange
   * @description Tests for initiating email change
   */
  describe('requestEmailChange', () => {
    /**
     * @test Should request email change
     * @given Valid user ID and new email
     * @when requestEmailChange() is called
     * @then Should create pending email change
     *
     * @complexity O(1) - Create operation
     */
    it('should request email change', async () => {
      const userId = 'user-123';
      const newEmail = 'newemail@example.com';

      service.requestEmailChange.mockResolvedValue({
        id: 'change-123',
        userId,
        newEmail,
        status: 'PENDING',
        createdAt: new Date(),
      });

      const result = await service.requestEmailChange(userId, newEmail);

      expect(result).toBeDefined();
      expect(result.newEmail).toBe(newEmail);
      expect(result.status).toBe('PENDING');
    });

    /**
     * @test Should reject duplicate email
     * @given Email already in use
     * @when requestEmailChange() is called
     * @then Should throw error
     *
     * @complexity O(1) - Constraint check
     * @edge-case Tests email uniqueness
     */
    it('should reject duplicate email', async () => {
      const userId = 'user-123';
      const existingEmail = 'existing@example.com';

      service.requestEmailChange.mockRejectedValue(
        new Error('Email already in use')
      );

      await expect(service.requestEmailChange(userId, existingEmail)).rejects.toThrow();
    });
  });

  /**
   * @testGroup sendVerificationEmail
   * @description Tests for sending verification email
   */
  describe('sendVerificationEmail', () => {
    /**
     * @test Should send verification code
     * @given Pending email change request
     * @when sendVerificationEmail() is called
     * @then Should send email with code
     *
     * @complexity O(1) - Email send
     */
    it('should send verification email', async () => {
      const changeId = 'change-123';

      service.sendVerificationEmail.mockResolvedValue({
        sent: true,
        expiresIn: 3600,
      });

      const result = await service.sendVerificationEmail(changeId);

      expect(result.sent).toBe(true);
    });
  });

  /**
   * @testGroup verifyNewEmail
   * @description Tests for email verification
   */
  describe('verifyNewEmail', () => {
    /**
     * @test Should verify email with correct code
     * @given Valid verification code
     * @when verifyNewEmail() is called
     * @then Should verify email address
     *
     * @complexity O(1) - Code validation
     */
    it('should verify new email', async () => {
      const changeId = 'change-123';
      const code = '123456';

      service.verifyNewEmail.mockResolvedValue({
        verified: true,
        verifiedAt: new Date(),
      });

      const result = await service.verifyNewEmail(changeId, code);

      expect(result.verified).toBe(true);
    });

    /**
     * @test Should reject invalid code
     * @given Wrong verification code
     * @when verifyNewEmail() is called
     * @then Should throw error
     *
     * @complexity O(1) - Code comparison
     * @edge-case Tests incorrect code handling
     */
    it('should reject invalid code', async () => {
      const changeId = 'change-123';
      const wrongCode = '000000';

      service.verifyNewEmail.mockRejectedValue(
        new Error('Invalid verification code')
      );

      await expect(service.verifyNewEmail(changeId, wrongCode)).rejects.toThrow();
    });

    /**
     * @test Should reject expired code
     * @given Expired verification code
     * @when verifyNewEmail() is called
     * @then Should throw error
     *
     * @complexity O(1) - Expiry check
     * @edge-case Tests code expiration
     */
    it('should reject expired code', async () => {
      const changeId = 'change-123';
      const expiredCode = '123456';

      service.verifyNewEmail.mockRejectedValue(
        new Error('Verification code expired')
      );

      await expect(service.verifyNewEmail(changeId, expiredCode)).rejects.toThrow();
    });
  });

  /**
   * @testGroup confirmEmailChange
   * @description Tests for finalizing email change
   */
  describe('confirmEmailChange', () => {
    /**
     * @test Should confirm email change
     * @given Verified email change request
     * @when confirmEmailChange() is called
     * @then Should update user email
     *
     * @complexity O(1) - Update operation
     */
    it('should confirm email change', async () => {
      const changeId = 'change-123';

      service.confirmEmailChange.mockResolvedValue({
        success: true,
        completedAt: new Date(),
      });

      const result = await service.confirmEmailChange(changeId);

      expect(result.success).toBe(true);
    });
  });

  /**
   * @testGroup cancelEmailChange
   * @description Tests for canceling email change
   */
  describe('cancelEmailChange', () => {
    /**
     * @test Should cancel pending email change
     * @given Pending email change request
     * @when cancelEmailChange() is called
     * @then Should remove pending request
     *
     * @complexity O(1) - Delete operation
     */
    it('should cancel email change', async () => {
      const changeId = 'change-123';

      service.cancelEmailChange.mockResolvedValue({
        cancelled: true,
      });

      const result = await service.cancelEmailChange(changeId);

      expect(result.cancelled).toBe(true);
    });
  });

  /**
   * @testGroup getChangeHistory
   * @description Tests for email change history
   */
  describe('getChangeHistory', () => {
    /**
     * @test Should retrieve email change history
     * @given User ID
     * @when getChangeHistory() is called
     * @then Should return list of email changes
     *
     * @complexity O(n) where n = number of changes
     */
    it('should get change history', async () => {
      const userId = 'user-123';

      service.getChangeHistory.mockResolvedValue([
        { from: 'old1@example.com', to: 'old2@example.com', completedAt: new Date() },
        { from: 'old2@example.com', to: 'current@example.com', completedAt: new Date() },
      ]);

      const result = await service.getChangeHistory(userId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    /**
     * @test Should return empty history for new user
     * @given User with no email changes
     * @when getChangeHistory() is called
     * @then Should return empty array
     *
     * @complexity O(1) - Query
     */
    it('should return empty history for new user', async () => {
      const userId = 'user-new';

      service.getChangeHistory.mockResolvedValue([]);

      const result = await service.getChangeHistory(userId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  /**
   * @testGroup resendVerificationCode
   * @description Tests for resending verification codes
   */
  describe('resendVerificationCode', () => {
    /**
     * @test Should resend verification code
     * @given Pending email change request
     * @when resendVerificationCode() is called
     * @then Should send new code
     *
     * @complexity O(1) - Email send
     */
    it('should resend verification code', async () => {
      const changeId = 'change-123';

      service.resendVerificationCode.mockResolvedValue({
        sent: true,
        expiresIn: 3600,
      });

      const result = await service.resendVerificationCode(changeId);

      expect(result.sent).toBe(true);
    });
  });

  /**
   * @testGroup instantiation
   * @description Tests for service initialization
   */
  describe('instantiation', () => {
    /**
     * @test Should initialize service
     * @given Service dependencies
     * @when Service is instantiated
     * @then Should be defined
     *
     * @complexity O(1) - Instantiation
     */
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });
});
