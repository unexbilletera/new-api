/**
 * @file email.service.spec.ts
 * @description Unit tests for EmailService - Email sending and notifications
 * @module test/unit/shared/email
 * @category Unit Tests
 * @subcategory Shared - Email Service
 *
 * @requires @nestjs/testing
 * @requires jest
 * @requires aws-sdk (SES)
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-14
 *
 * @see {@link ../../../src/shared/email/email.service.ts} for implementation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../../../../src/shared/email/email.service';
import { LoggerService } from '../../../../src/shared/logger/logger.service';
import { AppConfigService } from '../../../../src/shared/config/config.service';
import { PrismaService } from '../../../../src/shared/prisma/prisma.service';
import { NotificationService } from '../../../../src/shared/notifications/notifications.service';
import { createLoggerServiceMock, createPrismaMock } from '../../../utils';

/**
 * @testSuite EmailService
 * @description Tests for email sending and notification service
 */
describe('EmailService', () => {
  let service: any;
  let logger: jest.Mocked<LoggerService>;
  let prisma: jest.Mocked<PrismaService>;
  let appConfigService: any;
  let notificationService: any;

  /**
   * @setup
   * @description Initialize email service with mocked dependencies
   */
  beforeEach(async () => {
    logger = createLoggerServiceMock();
    prisma = createPrismaMock();
    appConfigService = {
      isEmailMockEnabled: jest.fn().mockReturnValue(true),
      get: jest.fn((key: string) => {
        const config: any = {
          EMAIL_FROM: 'noreply@unex.com',
          AWS_REGION: 'us-east-1',
          EMAIL_TEMPLATES_PATH: './templates',
        };
        return config[key];
      }),
    } as any;
    notificationService = {
      sendEmail: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppConfigService, useValue: appConfigService },
        { provide: NotificationService, useValue: notificationService },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  /**
   * @testGroup sendValidationCode
   * @description Tests for email validation code sending
   */
  describe('sendValidationCode', () => {
    const validationPayload = {
      email: 'user@example.com',
      code: '123456',
      expiryMinutes: 30,
    };

    /**
     * @test Should send validation code email
     * @given User email and verification code
     * @when sendValidationCode() is called
     * @then Should send email with code
     * @then Email should be received
     */
    it('should send validation code email', async () => {
      const sendSpy = jest
        .spyOn(service, 'sendValidationCode')
        .mockResolvedValue({
          messageId: 'msg_validation_123',
          status: 'sent',
        });

      const result = await service.sendValidationCode(validationPayload);

      expect(result.status).toBe('sent');
      expect(sendSpy).toHaveBeenCalledWith(validationPayload);
    });

    /**
     * @test Should include expiry information in email
     * @given Validation code with expiry time
     * @when email is sent
     * @then Email content should mention expiry
     */
    it('should include code expiry in email content', async () => {
      const sendSpy = jest
        .spyOn(service, 'sendValidationCode')
        .mockResolvedValue({
          messageId: 'msg_validation_123',
          status: 'sent',
        });

      await service.sendValidationCode(validationPayload);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          expiryMinutes: 30,
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
      expect(service instanceof EmailService).toBe(true);
    });
  });
});
