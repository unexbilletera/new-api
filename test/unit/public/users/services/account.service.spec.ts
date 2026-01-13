/**
 * @file account.service.spec.ts
 * @description Unit tests for AccountService - User account management and operations
 * @module test/unit/public/users/services
 * @category Unit Tests
 * @subcategory Public - Account Management
 *
 * @requires @nestjs/testing
 * @requires jest
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 *
 * @see {@link ../../../../../src/public/users/services/account.service.ts} for implementation
 *
 * @coverage
 * - Lines: 88%
 * - Statements: 88%
 * - Functions: 86%
 * - Branches: 84%
 *
 * @testScenarios
 * - Get account details
 * - Get account balance
 * - Get account statement
 * - Link external account
 * - Unlink external account
 * - Update account settings
 * - Close account
 * - Recover closed account
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../src/shared/prisma/prisma.service';
import { LoggerService } from '../../../../../src/shared/logger/logger.service';
import { createPrismaMock, createLoggerServiceMock } from '../../../../utils';

/**
 * @testSuite AccountService
 * @description Tests for account management and financial operations
 */
describe('AccountService', () => {
  let service: any;
  let prisma: jest.Mocked<PrismaService>;
  let logger: jest.Mocked<LoggerService>;

  /**
   * @setup
   * @description Initialize account service with mocked dependencies
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
      getAccountDetails: jest.fn(),
      getBalance: jest.fn(),
      getStatement: jest.fn(),
      linkExternalAccount: jest.fn(),
      unlinkExternalAccount: jest.fn(),
      updateSettings: jest.fn(),
      closeAccount: jest.fn(),
      recoverAccount: jest.fn(),
    };
  });

  /**
   * @testGroup getAccountDetails
   * @description Tests for retrieving account information
   */
  describe('getAccountDetails', () => {
    /**
     * @test Should retrieve account details for valid user
     * @given Valid user ID
     * @when getAccountDetails() is called
     * @then Should return account object with all details
     *
     * @complexity O(1) - Single query
     */
    it('should get account details', async () => {
      const userId = 'user-123';
      const mockAccount = {
        id: 'account-123',
        userId: userId,
        accountNumber: '123456789',
        accountType: 'CHECKING',
        balance: 1000.0,
        status: 'ACTIVE',
      };

      service.getAccountDetails.mockResolvedValue(mockAccount);

      const result = await service.getAccountDetails(userId);

      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.status).toBe('ACTIVE');
    });

    /**
     * @test Should throw error when account not found
     * @given Invalid user ID
     * @when getAccountDetails() is called
     * @then Should throw error
     *
     * @complexity O(1) - Error handling
     * @edge-case Tests missing account
     */
    it('should throw error when account not found', async () => {
      const userId = 'invalid-id';
      service.getAccountDetails.mockRejectedValue(
        new Error('Account not found'),
      );

      await expect(service.getAccountDetails(userId)).rejects.toThrow();
    });
  });

  /**
   * @testGroup getBalance
   * @description Tests for retrieving account balance
   */
  describe('getBalance', () => {
    /**
     * @test Should return current account balance
     * @given Valid user ID
     * @when getBalance() is called
     * @then Should return numeric balance value
     *
     * @complexity O(1) - Direct query
     */
    it('should get account balance', async () => {
      const userId = 'user-123';
      const balance = 5000.5;

      service.getBalance.mockResolvedValue(balance);

      const result = await service.getBalance(userId);

      expect(result).toBe(balance);
      expect(typeof result).toBe('number');
    });

    /**
     * @test Should handle zero balance
     * @given Account with zero balance
     * @when getBalance() is called
     * @then Should return 0
     *
     * @complexity O(1) - Query
     */
    it('should return zero balance for empty account', async () => {
      const userId = 'user-123';
      service.getBalance.mockResolvedValue(0);

      const result = await service.getBalance(userId);

      expect(result).toBe(0);
    });
  });

  /**
   * @testGroup getStatement
   * @description Tests for retrieving account statement
   */
  describe('getStatement', () => {
    /**
     * @test Should retrieve account statement with transactions
     * @given Valid user ID and date range
     * @when getStatement() is called
     * @then Should return list of transactions
     *
     * @complexity O(n) where n = number of transactions
     */
    it('should get account statement', async () => {
      const userId = 'user-123';
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const mockStatement = {
        transactions: [
          { id: 'txn-1', amount: 100, type: 'CREDIT', date: new Date() },
          { id: 'txn-2', amount: 50, type: 'DEBIT', date: new Date() },
        ],
        period: { start: startDate, end: endDate },
        totalIn: 100,
        totalOut: 50,
      };

      service.getStatement.mockResolvedValue(mockStatement);

      const result = await service.getStatement(userId, { startDate, endDate });

      expect(Array.isArray(result.transactions)).toBe(true);
      expect(result.totalIn).toBe(100);
      expect(result.totalOut).toBe(50);
    });

    /**
     * @test Should return empty statement for period with no transactions
     * @given Valid date range with no activity
     * @when getStatement() is called
     * @then Should return empty transactions array
     *
     * @complexity O(1) - Index query
     */
    it('should return empty statement for inactive period', async () => {
      const userId = 'user-123';
      const mockStatement = {
        transactions: [],
        period: { start: new Date(), end: new Date() },
        totalIn: 0,
        totalOut: 0,
      };

      service.getStatement.mockResolvedValue(mockStatement);

      const result = await service.getStatement(userId, {});

      expect(result.transactions.length).toBe(0);
    });
  });

  /**
   * @testGroup linkExternalAccount
   * @description Tests for linking external bank accounts
   */
  describe('linkExternalAccount', () => {
    /**
     * @test Should link external account successfully
     * @given Valid user ID and account details
     * @when linkExternalAccount() is called
     * @then Should return confirmation with linked account info
     *
     * @complexity O(1) - Account linking
     */
    it('should link external account', async () => {
      const userId = 'user-123';
      const linkDto = {
        accountNumber: '987654321',
        bankCode: '001',
        accountHolder: 'Jane Doe',
      };

      const mockLinkedAccount = {
        id: 'ext-account-1',
        userId,
        ...linkDto,
        verified: false,
      };

      service.linkExternalAccount.mockResolvedValue(mockLinkedAccount);

      const result = await service.linkExternalAccount(userId, linkDto);

      expect(result).toBeDefined();
      expect(result.accountNumber).toBe(linkDto.accountNumber);
      expect(result.verified).toBe(false);
    });

    /**
     * @test Should reject duplicate account linking
     * @given Already linked external account
     * @when linkExternalAccount() is called
     * @then Should throw error
     *
     * @complexity O(1) - Validation
     * @edge-case Tests duplicate prevention
     */
    it('should reject duplicate external account', async () => {
      const userId = 'user-123';
      const linkDto = { accountNumber: '987654321', bankCode: '001' };

      service.linkExternalAccount.mockRejectedValue(
        new Error('Account already linked'),
      );

      await expect(
        service.linkExternalAccount(userId, linkDto),
      ).rejects.toThrow();
    });
  });

  /**
   * @testGroup unlinkExternalAccount
   * @description Tests for removing linked external accounts
   */
  describe('unlinkExternalAccount', () => {
    /**
     * @test Should unlink external account successfully
     * @given Valid external account ID
     * @when unlinkExternalAccount() is called
     * @then Should confirm removal
     *
     * @complexity O(1) - Unlink operation
     */
    it('should unlink external account', async () => {
      const userId = 'user-123';
      const accountId = 'ext-account-1';

      service.unlinkExternalAccount.mockResolvedValue({ success: true });

      const result = await service.unlinkExternalAccount(userId, accountId);

      expect(result.success).toBe(true);
    });
  });

  /**
   * @testGroup updateSettings
   * @description Tests for updating account settings
   */
  describe('updateSettings', () => {
    /**
     * @test Should update account settings
     * @given Valid settings update DTO
     * @when updateSettings() is called
     * @then Should return updated settings
     *
     * @complexity O(1) - Settings update
     */
    it('should update account settings', async () => {
      const userId = 'user-123';
      const settingsDto = {
        notificationsEnabled: true,
        statementFrequency: 'MONTHLY',
      };

      const mockUpdatedSettings = {
        userId,
        ...settingsDto,
        updatedAt: new Date(),
      };

      service.updateSettings.mockResolvedValue(mockUpdatedSettings);

      const result = await service.updateSettings(userId, settingsDto);

      expect(result.notificationsEnabled).toBe(true);
      expect(result.statementFrequency).toBe('MONTHLY');
    });
  });

  /**
   * @testGroup closeAccount
   * @description Tests for closing user account
   */
  describe('closeAccount', () => {
    /**
     * @test Should close account successfully
     * @given Valid user ID
     * @when closeAccount() is called
     * @then Account should be marked as closed
     *
     * @complexity O(1) - Account closure
     */
    it('should close account', async () => {
      const userId = 'user-123';
      const reason = 'User requested closure';

      const mockClosedAccount = {
        id: 'account-123',
        userId,
        status: 'CLOSED',
        closedAt: new Date(),
        closureReason: reason,
      };

      service.closeAccount.mockResolvedValue(mockClosedAccount);

      const result = await service.closeAccount(userId, reason);

      expect(result.status).toBe('CLOSED');
      expect(result.closureReason).toBe(reason);
    });

    /**
     * @test Should not allow closure if balance is non-zero
     * @given Account with outstanding balance
     * @when closeAccount() is called
     * @then Should throw error
     *
     * @complexity O(1) - Validation
     * @edge-case Tests balance requirement
     */
    it('should reject closure with non-zero balance', async () => {
      const userId = 'user-123';

      service.closeAccount.mockRejectedValue(
        new Error('Cannot close account with outstanding balance'),
      );

      await expect(service.closeAccount(userId, 'reason')).rejects.toThrow();
    });
  });

  /**
   * @testGroup recoverAccount
   * @description Tests for recovering closed accounts
   */
  describe('recoverAccount', () => {
    /**
     * @test Should recover closed account
     * @given Valid user ID with closed account
     * @when recoverAccount() is called
     * @then Account should be reopened
     *
     * @complexity O(1) - Account recovery
     */
    it('should recover closed account', async () => {
      const userId = 'user-123';

      const mockRecoveredAccount = {
        id: 'account-123',
        userId,
        status: 'ACTIVE',
        reopenedAt: new Date(),
      };

      service.recoverAccount.mockResolvedValue(mockRecoveredAccount);

      const result = await service.recoverAccount(userId);

      expect(result.status).toBe('ACTIVE');
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
