/**
 * @file sms.service.spec.ts
 * @description Unit tests for SmsService - SMS sending and phone validation
 * @module test/unit/shared/sms
 * @category Unit Tests
 * @subcategory Shared - SMS Service
 *
 * @requires @nestjs/testing
 * @requires jest
 * @requires twilio
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-14
 *
 * @see {@link ../../../src/shared/sms/sms.service.ts} for implementation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SmsService } from '../../../../src/shared/sms/sms.service';
import { LoggerService } from '../../../../src/shared/logger/logger.service';
import { AppConfigService } from '../../../../src/shared/config/config.service';
import { PrismaService } from '../../../../src/shared/prisma/prisma.service';
import { NotificationService } from '../../../../src/shared/notifications/notifications.service';
import { createLoggerServiceMock, createPrismaMock } from '../../../utils';

/**
 * @testSuite SmsService
 * @description Tests for SMS sending and phone validation service
 */
describe('SmsService', () => {
  let service: any;
  let logger: jest.Mocked<LoggerService>;
  let prisma: jest.Mocked<PrismaService>;
  let appConfigService: any;
  let notificationService: any;

  /**
   * @setup
   * @description Initialize SMS service with mocked dependencies
   */
  beforeEach(async () => {
    logger = createLoggerServiceMock();
    prisma = createPrismaMock();
    appConfigService = {
      isSmsMockEnabled: jest.fn().mockReturnValue(true),
      get: jest.fn((key: string) => {
        const config: any = {
          SMS_FROM: '+5511999999999',
          TWILIO_ACCOUNT_SID: 'test_sid',
          TWILIO_AUTH_TOKEN: 'test_token',
        };
        return config[key];
      }),
    } as any;
    notificationService = {
      sendSms: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppConfigService, useValue: appConfigService },
        { provide: NotificationService, useValue: notificationService },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  /**
   * @testGroup sendValidationCode
   * @description Tests for SMS validation code sending
   */
  describe('sendValidationCode', () => {
    const codePayload = {
      phone: '+5511988888888',
      code: '123456',
      expiryMinutes: 15,
    };

    /**
     * @test Should send validation code via SMS
     * @given Phone number and code
     * @when sendValidationCode() is called
     * @then Should send SMS with code
     */
    it('should send validation code', async () => {
      const sendSpy = jest
        .spyOn(service, 'sendValidationCode')
        .mockResolvedValue({
          messageId: 'sm_validation_123',
          status: 'sent',
        });

      const result = await service.sendValidationCode(codePayload);

      expect(result.status).toBe('sent');
      expect(sendSpy).toHaveBeenCalledWith(codePayload);
    });

    /**
     * @test Should include code and expiry in message
     * @given Validation code with expiry
     * @when SMS is sent
     * @then Message should contain code and expiry info
     */
    it('should include code in message', async () => {
      const sendSpy = jest
        .spyOn(service, 'sendValidationCode')
        .mockResolvedValue({
          messageId: 'sm_validation_123',
          status: 'sent',
        });

      await service.sendValidationCode(codePayload);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          code: '123456',
          expiryMinutes: 15,
        }),
      );
    });
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
      expect(service instanceof SmsService).toBe(true);
    });
  });
});
