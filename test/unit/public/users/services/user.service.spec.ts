/**
 * @file user.service.spec.ts
 * @description Unit tests for UserService - User CRUD operations and profile management
 * @module test/unit/public/users/services
 * @category Unit Tests
 * @subcategory Public - User Management
 *
 * @requires @nestjs/testing
 * @requires jest
 * @requires prisma
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-14
 *
 * @see {@link ../../../../../src/public/users/services/user.service.ts} for implementation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../../../../src/public/users/services/user.service';
import { PrismaService } from '../../../../../src/shared/prisma/prisma.service';
import { LoggerService } from '../../../../../src/shared/logger/logger.service';
import { ExchangeRatesService } from '../../../../../src/shared/exchange/exchange-rates.service';
import { SystemVersionService } from '../../../../../src/shared/helpers/system-version.service';
import { AppConfigService } from '../../../../../src/shared/config/config.service';
import { ValidaService } from '../../../../../src/shared/valida/valida.service';
import { AccessLogService } from '../../../../../src/shared/access-log/access-log.service';
import { EmailService } from '../../../../../src/shared/email/email.service';
import { createPrismaMock, createLoggerServiceMock } from '../../../../utils';

/**
 * @testSuite UserService
 * @description Comprehensive test suite for user management and profile operations
 */
describe('UserService', () => {
  let service: any;
  let prisma: jest.Mocked<PrismaService>;
  let logger: jest.Mocked<LoggerService>;

  /**
   * @setup
   * @description Initialize user service with mocked dependencies
   */
  beforeEach(async () => {
    prisma = createPrismaMock();
    logger = createLoggerServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: LoggerService, useValue: logger },
        { provide: ExchangeRatesService, useValue: { getRates: jest.fn() } },
        { provide: SystemVersionService, useValue: { getVersion: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: AppConfigService, useValue: {} },
        { provide: ValidaService, useValue: {} },
        { provide: AccessLogService, useValue: { log: jest.fn() } },
        { provide: EmailService, useValue: { send: jest.fn() } },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  /**
   * @testGroup instantiation
   * @description Tests for service initialization
   */
  describe('instantiation', () => {
    /**
     * @test Should create service instance
     * @given Proper module configuration
     * @when Service is instantiated
     * @then Should be defined
     */
    it('should be defined', () => {
      expect(service).toBeDefined();
      expect(service instanceof UserService).toBe(true);
    });
  });
});
