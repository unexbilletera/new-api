/**
 * @file sms.mock.ts
 * @description Mock factory for SmsService - SMS sending and validation
 * @module test/utils/mocks
 * @category Test Utilities
 * @subcategory Mocks
 *
 * @author Unex Development Team
 * @since 2.0.0
 */

import { SmsService } from '../../../src/shared/sms/sms.service';

/**
 * @function createSmsServiceMock
 * @description Create mocked SmsService for testing SMS validation flows
 * @returns {jest.Mocked<SmsService>} Mocked SMS service
 *
 * @example
 * const smsService = createSmsServiceMock();
 * smsService.sendSms.mockResolvedValue({ messageId: 'sms-123' });
 */
export function createSmsServiceMock(): jest.Mocked<SmsService> {
  return {
    sendSms: jest
      .fn()
      .mockResolvedValue({ messageId: 'sms_mock_12345', status: 'sent' }),
    sendValidationCode: jest
      .fn()
      .mockResolvedValue({ messageId: 'sms_mock_12345', status: 'sent' }),
    sendOtp: jest
      .fn()
      .mockResolvedValue({ messageId: 'sms_mock_12345', status: 'sent' }),
    sendNotification: jest
      .fn()
      .mockResolvedValue({ messageId: 'sms_mock_12345', status: 'sent' }),
    sendBulk: jest
      .fn()
      .mockResolvedValue([{ messageId: 'sms_mock_12345', status: 'sent' }]),
    verifyPhoneNumber: jest.fn().mockResolvedValue(true),
    formatPhoneNumber: jest.fn().mockReturnValue('+5511999999999'),
  } as any;
}
