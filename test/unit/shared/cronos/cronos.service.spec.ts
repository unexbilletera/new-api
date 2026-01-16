/**
 * @file cronos.service.spec.ts
 * @description Unit tests for CronosService - Cronos banking integration
 * @module test/unit/shared/cronos
 * @category Unit Tests
 * @subcategory Shared - Cronos Service
 *
 * @requires @nestjs/testing
 * @requires jest
 *
 * @author Unex Development Team
 * @since 2.0.0
 *
 * @coverage
 * - Lines: 90%+
 * - Statements: 90%+
 * - Functions: 90%+
 * - Branches: 90%+
 *
 * @testScenarios
 * - Service initialization and configuration
 * - Token management (app and user tokens)
 * - PIX transfers (create and confirm)
 * - Account operations (balance, transactions)
 * - Onboarding flow (all steps)
 * - Error handling
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CronosService } from '../../../../src/shared/cronos/cronos.service';
import { ConfigService } from '../../../../src/shared/config/config.service';
import { LoggerService } from '../../../../src/shared/logger/logger.service';
import { PrismaService } from '../../../../src/shared/prisma/prisma.service';
import {
  createLoggerServiceMock,
  createPrismaMock,
} from '../../../utils/mocks';

jest.mock('node-fetch', () => {
  const actualFetch = jest.requireActual('node-fetch');
  return {
    __esModule: true,
    default: jest.fn(),
    Response: actualFetch.Response,
  };
});

jest.mock('socks-proxy-agent', () => ({
  SocksProxyAgent: jest.fn().mockImplementation(() => ({})),
}));

import fetch from 'node-fetch';
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

/**
 * @testSuite CronosService
 * @description Comprehensive test suite for Cronos banking integration service
 */
describe('CronosService', () => {
  let service: CronosService;
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<LoggerService>;
  let prisma: jest.Mocked<PrismaService>;

  const mockConfig = {
    WALLET_CRONOS: 'enable',
    WALLET_CRONOS_LOG: 'enable',
    WALLET_CRONOS_PROXY: 'disable',
    WALLET_CRONOS_URL: 'https://api.cronos.test',
    WALLET_CRONOS_USERNAME: 'test-username',
    WALLET_CRONOS_PASSWORD: 'test-password',
    WALLET_CRONOS_USER_PASSWORD: 'user-password',
    WALLET_CRONOS_WEBHOOK_SECRET: 'webhook-secret',
    USE_SOCKS_PROXY: 'false',
  };

  const mockAppToken = 'mock-app-token-123';
  const mockUserToken = 'mock-user-token-456';

  /**
   * @setup
   * @description Initialize testing module with mocked dependencies
   */
  beforeEach(async () => {
    jest.clearAllMocks();

    logger = createLoggerServiceMock();
    logger.success = jest.fn();
    logger.errorWithStack = jest.fn();
    logger.critical = jest.fn();

    prisma = createPrismaMock();

    configService = {
      get: jest.fn((key: string) => mockConfig[key]),
      databaseUrl: '',
      jwtSecret: '',
      jwtExpiresIn: '',
      serverPort: 3000,
      serverUrl: '',
      redisUrl: '',
      nodeEnv: 'test',
      isProduction: false,
      isSandbox: false,
      isDevelopment: true,
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronosService,
        { provide: ConfigService, useValue: configService },
        { provide: LoggerService, useValue: logger },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CronosService>(CronosService);
  });

  /**
   * @testGroup Service Initialization
   * @description Tests for service creation and configuration
   */
  describe('instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should be an instance of CronosService', () => {
      expect(service).toBeInstanceOf(CronosService);
    });
  });

  /**
   * @testGroup onModuleInit
   * @description Tests for module initialization
   */
  describe('onModuleInit', () => {
    it('should initialize configuration on module init', () => {
      service.onModuleInit();

      expect(configService.get).toHaveBeenCalledWith('WALLET_CRONOS_URL');
      expect(configService.get).toHaveBeenCalledWith('WALLET_CRONOS');
    });

    it('should log warning when Cronos is disabled', () => {
      configService.get = jest.fn((key: string) => {
        if (key === 'WALLET_CRONOS') return 'disable';
        return mockConfig[key];
      });

      service.onModuleInit();

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle empty API URL gracefully', () => {
      configService.get = jest.fn((key: string) => {
        if (key === 'WALLET_CRONOS_URL') return '';
        return mockConfig[key];
      });

      expect(() => service.onModuleInit()).not.toThrow();
    });

    it('should log warning when using staging URL', () => {
      configService.get = jest.fn((key: string) => {
        if (key === 'WALLET_CRONOS_URL') return 'https://stage.cronos.test';
        return mockConfig[key];
      });

      service.onModuleInit();

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should configure proxy when enabled', () => {
      configService.get = jest.fn((key: string) => {
        if (key === 'WALLET_CRONOS_PROXY') return 'enable';
        return mockConfig[key];
      });

      service.onModuleInit();

      expect(logger.warn).toHaveBeenCalled();
    });
  });

  /**
   * @testGroup transferPix
   * @description Tests for PIX transfer creation
   */
  describe('transferPix', () => {
    const mockTransferParams = {
      document: '12345678901',
      keyType: 'cpf',
      keyValue: '12345678901',
    };

    const mockTransferResponse = {
      id_pagamento: 'payment-123',
      recebedor: {
        pessoa: {
          nome: 'Test Person',
          tipoDocumento: 'CPF',
          documento: '12345678901',
        },
        conta: {
          banco: '001',
          bancoNome: 'Test Bank',
          agencia: '0001',
          numero: '12345-6',
        },
      },
    };

    beforeEach(() => {
      service.onModuleInit();
    });

    it('should throw error when document is missing', async () => {
      await expect(
        service.transferPix({ document: '', keyType: 'cpf', keyValue: '123' }),
      ).rejects.toThrow('Missing document. Invalid parameters');
    });

    it('should throw error when keyType is missing', async () => {
      await expect(
        service.transferPix({ document: '123', keyType: '', keyValue: '123' }),
      ).rejects.toThrow('Missing keyType. Invalid parameters');
    });

    it('should throw error when keyValue is missing', async () => {
      await expect(
        service.transferPix({ document: '123', keyType: 'cpf', keyValue: '' }),
      ).rejects.toThrow('Missing keyValue. Invalid parameters');
    });

    it('should create PIX transfer successfully with user auth', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockAppToken })),
          status: 200,
          statusText: 'OK',
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockUserToken })),
          status: 200,
          statusText: 'OK',
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify(mockTransferResponse)),
          status: 200,
          statusText: 'OK',
          headers: { forEach: jest.fn() },
        } as any);

      const result = await service.transferPix(mockTransferParams);

      expect(result).toBeDefined();
      expect(result.id_pagamento).toBe('payment-123');
      expect(result.recebedor.pessoa.nome).toBe('Test Person');
    });

    it('should fallback to app token when user auth fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockAppToken })),
          status: 200,
          statusText: 'OK',
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          text: jest.fn().mockResolvedValue('{"error": "User not found"}'),
          status: 401,
          statusText: 'Unauthorized',
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify(mockTransferResponse)),
          status: 200,
          statusText: 'OK',
          headers: { forEach: jest.fn() },
        } as any);

      const result = await service.transferPix(mockTransferParams);

      expect(result).toBeDefined();
      expect(result.id_pagamento).toBe('payment-123');
    });

    it('should throw error on invalid response', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockAppToken })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockUserToken })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue(JSON.stringify({ success: true })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any);

      await expect(service.transferPix(mockTransferParams)).rejects.toThrow(
        'Invalid response from Cronos API',
      );
    });
  });

  /**
   * @testGroup confirmTransferPix
   * @description Tests for PIX transfer confirmation
   */
  describe('confirmTransferPix', () => {
    const mockConfirmParams = {
      document: '12345678901',
      id: 'payment-123',
      amount: 100.0,
      description: 'Test payment',
    };

    beforeEach(() => {
      service.onModuleInit();
    });

    it('should throw error when document is missing', async () => {
      await expect(
        service.confirmTransferPix({ document: '', id: '123', amount: 100 }),
      ).rejects.toThrow('Missing document. Invalid parameters');
    });

    it('should throw error when id is missing', async () => {
      await expect(
        service.confirmTransferPix({ document: '123', id: '', amount: 100 }),
      ).rejects.toThrow('Missing id. Invalid parameters');
    });

    it('should throw error when amount is missing', async () => {
      await expect(
        service.confirmTransferPix({ document: '123', id: '123', amount: 0 }),
      ).rejects.toThrow('Missing amount. Invalid parameters');
    });

    it('should confirm PIX transfer successfully', async () => {
      const mockConfirmResponse = { success: true, transactionId: 'tx-123' };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockAppToken })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockUserToken })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify(mockConfirmResponse)),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any);

      const result = await service.confirmTransferPix(mockConfirmParams);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  /**
   * @testGroup createTransactionalToken
   * @description Tests for transactional token creation
   */
  describe('createTransactionalToken', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should throw error when document is missing', async () => {
      await expect(
        service.createTransactionalToken({ document: '', amount: 100 }),
      ).rejects.toThrow('Missing document. Invalid parameters');
    });

    it('should throw error when amount is missing', async () => {
      await expect(
        service.createTransactionalToken({ document: '123', amount: 0 }),
      ).rejects.toThrow('Missing amount. Invalid parameters');
    });

    it('should create transactional token successfully', async () => {
      const mockTokenResponse = { token: 'tx-token-123', success: true };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockAppToken })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockUserToken })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue(JSON.stringify(mockTokenResponse)),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any);

      const result = await service.createTransactionalToken({
        document: '12345678901',
        amount: 100,
        lat: -23.5,
        lon: -46.6,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  /**
   * @testGroup confirmTransactionPassword
   * @description Tests for transaction password confirmation
   */
  describe('confirmTransactionPassword', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should throw error when document is missing', async () => {
      await expect(
        service.confirmTransactionPassword({ document: '' }),
      ).rejects.toThrow('Missing document. Invalid parameters');
    });

    it('should handle missing userPassword by attempting request', async () => {
      configService.get = jest.fn((key: string) => {
        if (key === 'WALLET_CRONOS_USER_PASSWORD') return '';
        return mockConfig[key];
      });
      service.onModuleInit();

      await expect(
        service.confirmTransactionPassword({ document: '123' }),
      ).rejects.toThrow();
    });

    it('should confirm transaction password successfully', async () => {
      const mockResponse = { success: true };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockAppToken })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockUserToken })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue(JSON.stringify(mockResponse)),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any);

      const result = await service.confirmTransactionPassword({
        document: '12345678901',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  /**
   * @testGroup getAccountBalance
   * @description Tests for account balance retrieval
   */
  describe('getAccountBalance', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should throw error when document is missing', async () => {
      await expect(service.getAccountBalance({ document: '' })).rejects.toThrow(
        'Missing document. Invalid parameters',
      );
    });

    it('should get account balance successfully', async () => {
      const mockBalanceResponse = { amount: 1000.5, balance: 1000.5 };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockAppToken })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockUserToken })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify(mockBalanceResponse)),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any);

      const result = await service.getAccountBalance({
        document: '12345678901',
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(1000.5);
    });
  });

  /**
   * @testGroup getTransactions
   * @description Tests for transaction retrieval
   */
  describe('getTransactions', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should throw error when document is missing', async () => {
      await expect(service.getTransactions({ document: '' })).rejects.toThrow(
        'Missing document. Invalid parameters',
      );
    });

    it('should get transactions with filters successfully', async () => {
      const mockTransactionsResponse = {
        statements: [
          { id: 'tx-1', amount: 100, type: 'credit' },
          { id: 'tx-2', amount: 50, type: 'debit' },
        ],
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockAppToken })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockUserToken })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify(mockTransactionsResponse)),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any);

      const result = await service.getTransactions({
        document: '12345678901',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        limit: '10',
      });

      expect(result).toBeDefined();
      expect(result.statements).toHaveLength(2);
    });
  });

  /**
   * @testGroup syncCronosBalance
   * @description Tests for balance synchronization
   */
  describe('syncCronosBalance', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should handle missing userId gracefully', async () => {
      await expect(
        service.syncCronosBalance({
          userId: '',
          userIdentities: [],
          userAccounts: [],
        }),
      ).resolves.toBeUndefined();
    });

    it('should return early when no BR identity found', async () => {
      await service.syncCronosBalance({
        userId: 'user-123',
        userIdentities: [
          { country: 'us', status: 'enable', taxDocumentNumber: '123' },
        ],
        userAccounts: [],
      });

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should return early when no Cronos account found', async () => {
      await service.syncCronosBalance({
        userId: 'user-123',
        userIdentities: [
          { country: 'br', status: 'enable', taxDocumentNumber: '12345678901' },
        ],
        userAccounts: [
          { id: 'acc-1', type: 'other', status: 'enable', balance: '100' },
        ],
      });

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should sync balance when discrepancy found', async () => {
      const mockBalanceResponse = { amount: 500 };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockAppToken })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockUserToken })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify(mockBalanceResponse)),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any);

      (prisma as any).usersAccounts = {
        update: jest.fn().mockResolvedValue({}),
      };

      await service.syncCronosBalance({
        userId: 'user-123',
        userIdentities: [
          { country: 'br', status: 'enable', taxDocumentNumber: '12345678901' },
        ],
        userAccounts: [
          { id: 'acc-1', type: 'cronos', status: 'enable', balance: '1000' },
        ],
      });

      expect(logger.warn).toHaveBeenCalled();
    });
  });

  /**
   * @testGroup Onboarding Steps
   * @description Tests for onboarding process
   */
  describe('onboarding', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    describe('onboardingStart', () => {
      it('should throw error when document is missing', async () => {
        await expect(service.onboardingStart({ document: '' })).rejects.toThrow(
          'Missing document. Invalid parameters',
        );
      });

      it('should start onboarding successfully', async () => {
        const mockResponse = { individual_id: 'ind-123' };

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            text: jest
              .fn()
              .mockResolvedValue(JSON.stringify({ token: mockAppToken })),
            status: 200,
            headers: { forEach: jest.fn() },
          } as any)
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(JSON.stringify(mockResponse)),
            status: 200,
            headers: { forEach: jest.fn() },
          } as any);

        const result = await service.onboardingStart({
          document: '12345678901',
        });

        expect(result).toBeDefined();
        expect(result.individual_id).toBe('ind-123');
      });
    });

    describe('onboardingStep1', () => {
      it('should throw error when cronosId is missing', async () => {
        await expect(
          service.onboardingStep1({
            cronosId: '',
            name: 'Test',
            email: 'test@test.com',
          }),
        ).rejects.toThrow('Missing cronosId. Invalid parameters');
      });

      it('should throw error when name is missing', async () => {
        await expect(
          service.onboardingStep1({
            cronosId: 'ind-123',
            name: '',
            email: 'test@test.com',
          }),
        ).rejects.toThrow('Missing name. Invalid parameters');
      });

      it('should throw error when email is missing', async () => {
        await expect(
          service.onboardingStep1({
            cronosId: 'ind-123',
            name: 'Test',
            email: '',
          }),
        ).rejects.toThrow('Missing email. Invalid parameters');
      });
    });

    describe('onboardingStep2', () => {
      it('should throw error when cronosId is missing', async () => {
        await expect(
          service.onboardingStep2({
            cronosId: '',
            phonePrefix: '+55',
            phoneNumber: '123456789',
          }),
        ).rejects.toThrow('Missing cronosId. Invalid parameters');
      });

      it('should throw error when phonePrefix is missing', async () => {
        await expect(
          service.onboardingStep2({
            cronosId: 'ind-123',
            phonePrefix: '',
            phoneNumber: '123456789',
          }),
        ).rejects.toThrow('Missing phonePrefix. Invalid parameters');
      });

      it('should throw error when phoneNumber is missing', async () => {
        await expect(
          service.onboardingStep2({
            cronosId: 'ind-123',
            phonePrefix: '+55',
            phoneNumber: '',
          }),
        ).rejects.toThrow('Missing phoneNumber. Invalid parameters');
      });
    });

    describe('onboardingStep3', () => {
      it('should throw error when cronosId is missing', async () => {
        await expect(
          service.onboardingStep3({
            cronosId: '',
            documentType: 'rg',
            documentFace: 'front',
            fileUrl: 'http://test.com',
          }),
        ).rejects.toThrow('Missing cronosId. Invalid parameters');
      });

      it('should throw error when documentType is missing', async () => {
        await expect(
          service.onboardingStep3({
            cronosId: 'ind-123',
            documentType: '',
            documentFace: 'front',
            fileUrl: 'http://test.com',
          }),
        ).rejects.toThrow('Missing documentType. Invalid parameters');
      });

      it('should throw error when documentFace is missing', async () => {
        await expect(
          service.onboardingStep3({
            cronosId: 'ind-123',
            documentType: 'rg',
            documentFace: '',
            fileUrl: 'http://test.com',
          }),
        ).rejects.toThrow('Missing documentFace. Invalid parameters');
      });

      it('should throw error when fileUrl is missing', async () => {
        await expect(
          service.onboardingStep3({
            cronosId: 'ind-123',
            documentType: 'rg',
            documentFace: 'front',
            fileUrl: '',
          }),
        ).rejects.toThrow('Missing fileUrl. Invalid parameters');
      });
    });

    describe('onboardingStep4', () => {
      it('should throw error when cronosId is missing', async () => {
        await expect(service.onboardingStep4({ cronosId: '' })).rejects.toThrow(
          'Missing cronosId. Invalid parameters',
        );
      });
    });

    describe('onboardingStep5', () => {
      it('should throw error when cronosId is missing', async () => {
        await expect(
          service.onboardingStep5({ cronosId: '', fileUrl: 'http://test.com' }),
        ).rejects.toThrow('Missing cronosId. Invalid parameters');
      });

      it('should throw error when fileUrl is missing', async () => {
        await expect(
          service.onboardingStep5({ cronosId: 'ind-123', fileUrl: '' }),
        ).rejects.toThrow('Missing fileUrl. Invalid parameters');
      });
    });

    describe('onboardingStep6', () => {
      const validStep6Params = {
        cronosId: 'ind-123',
        zipCode: '01310-100',
        street: 'Avenida Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        state: 'SP',
        city: 'Sao Paulo',
        country: 'BR',
      };

      it('should throw error when cronosId is missing', async () => {
        await expect(
          service.onboardingStep6({ ...validStep6Params, cronosId: '' }),
        ).rejects.toThrow('Missing cronosId. Invalid parameters');
      });

      it('should throw error when zipCode is missing', async () => {
        await expect(
          service.onboardingStep6({ ...validStep6Params, zipCode: '' }),
        ).rejects.toThrow('Missing zipCode. Invalid parameters');
      });

      it('should throw error when street is missing', async () => {
        await expect(
          service.onboardingStep6({ ...validStep6Params, street: '' }),
        ).rejects.toThrow('Missing street. Invalid parameters');
      });

      it('should throw error when number is missing', async () => {
        await expect(
          service.onboardingStep6({ ...validStep6Params, number: '' }),
        ).rejects.toThrow('Missing number. Invalid parameters');
      });

      it('should throw error when neighborhood is missing', async () => {
        await expect(
          service.onboardingStep6({ ...validStep6Params, neighborhood: '' }),
        ).rejects.toThrow('Missing neighborhood. Invalid parameters');
      });

      it('should throw error when state is missing', async () => {
        await expect(
          service.onboardingStep6({ ...validStep6Params, state: '' }),
        ).rejects.toThrow('Missing state. Invalid parameters');
      });

      it('should throw error when city is missing', async () => {
        await expect(
          service.onboardingStep6({ ...validStep6Params, city: '' }),
        ).rejects.toThrow('Missing city. Invalid parameters');
      });

      it('should throw error when country is missing', async () => {
        await expect(
          service.onboardingStep6({ ...validStep6Params, country: '' }),
        ).rejects.toThrow('Missing country. Invalid parameters');
      });
    });

    describe('onboardingStep7', () => {
      it('should throw error when cronosId is missing', async () => {
        await expect(service.onboardingStep7({ cronosId: '' })).rejects.toThrow(
          'Missing cronosId. Invalid parameters',
        );
      });
    });

    describe('getOnboardingStatus', () => {
      it('should throw error when cronosId is missing', async () => {
        await expect(
          service.getOnboardingStatus({ cronosId: '' }),
        ).rejects.toThrow('Missing cronosId. Invalid parameters');
      });
    });
  });

  /**
   * @testGroup Account Operations
   * @description Tests for account operations
   */
  describe('account operations', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    describe('getAccount', () => {
      it('should throw error when document is missing', async () => {
        await expect(service.getAccount({ document: '' })).rejects.toThrow(
          'Missing document. Invalid parameters',
        );
      });
    });

    describe('getPixKeys', () => {
      it('should throw error when document is missing', async () => {
        await expect(service.getPixKeys({ document: '' })).rejects.toThrow(
          'Missing document. Invalid parameters',
        );
      });
    });

    describe('addPixKey', () => {
      it('should throw error when document is missing', async () => {
        await expect(
          service.addPixKey({ document: '', type: 'cpf', key: '123' }),
        ).rejects.toThrow('Missing document. Invalid parameters');
      });

      it('should throw error when type is missing', async () => {
        await expect(
          service.addPixKey({ document: '123', type: '', key: '123' }),
        ).rejects.toThrow('Missing type. Invalid parameters');
      });

      it('should throw error when key is missing', async () => {
        await expect(
          service.addPixKey({ document: '123', type: 'cpf', key: '' }),
        ).rejects.toThrow('Missing key. Invalid parameters');
      });
    });

    describe('getAlias', () => {
      it('should return empty object when document is missing', async () => {
        const result = await service.getAlias({ document: '' });
        expect(result).toEqual({});
      });

      it('should return alias from PIX keys', async () => {
        const mockPixKeys = {
          chaves: [
            { chave_tipo: 'cpf', chave: '12345678901' },
            { chave_tipo: 'email', chave: 'test@test.com' },
            { chave_tipo: 'evp', chave: 'uuid-evp' },
          ],
        };

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            text: jest
              .fn()
              .mockResolvedValue(JSON.stringify({ token: mockAppToken })),
            status: 200,
            headers: { forEach: jest.fn() },
          } as any)
          .mockResolvedValueOnce({
            ok: true,
            text: jest
              .fn()
              .mockResolvedValue(JSON.stringify({ token: mockUserToken })),
            status: 200,
            headers: { forEach: jest.fn() },
          } as any)
          .mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue(JSON.stringify(mockPixKeys)),
            status: 200,
            headers: { forEach: jest.fn() },
          } as any);

        const result = await service.getAlias({ document: '12345678901' });

        expect(result).toBeDefined();
        expect(result.cpf).toBe('12345678901');
        expect(result.email).toBe('test@test.com');
        expect(result.evp).toBe('uuid-evp');
      });
    });
  });

  /**
   * @testGroup Simplified Onboarding
   * @description Tests for simplified onboarding process
   */
  describe('onboarding (simplified)', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should throw error when cronosId is missing', async () => {
      await expect(
        service.onboarding({
          cronosId: '',
          name: 'Test',
          email: 'test@test.com',
          phone: '11999999999',
        }),
      ).rejects.toThrow('Missing cronosId. Invalid parameters');
    });

    it('should complete simplified onboarding successfully', async () => {
      const mockResponse = { success: true, status: 'completed' };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ token: mockAppToken })),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue(JSON.stringify(mockResponse)),
          status: 200,
          headers: { forEach: jest.fn() },
        } as any);

      const result = await service.onboarding({
        cronosId: 'ind-123',
        name: 'Test User',
        email: 'test@test.com',
        phone: '11999999999',
        gender: 'male',
        birthdate: '1990-01-01',
        maritalStatus: 'single',
        nationality: 'BR',
        motherName: 'Mother Name',
        pep: 'no',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});
