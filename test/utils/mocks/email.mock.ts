/**
 * @file email.mock.ts
 * @description Mock factory for EmailService - Email sending and validation
 * @module test/utils/mocks
 * @category Test Utilities
 * @subcategory Mocks
 *
 * @author Unex Development Team
 * @since 2.0.0
 */

import { EmailService } from '../../../src/shared/email/email.service';

/**
 * @function createEmailServiceMock
 * @description Create mocked EmailService for testing notification flows
 * @returns {jest.Mocked<EmailService>} Mocked email service
 *
 * @example
 * const emailService = createEmailServiceMock();
 * emailService.sendEmail.mockResolvedValue({ messageId: 'msg-123' });
 */
export function createEmailServiceMock(): jest.Mocked<EmailService> {
  return {
    sendEmail: jest
      .fn()
      .mockResolvedValue({ messageId: 'msg_mock_12345', status: 'sent' }),
    sendValidationCode: jest
      .fn()
      .mockResolvedValue({ messageId: 'msg_mock_12345', status: 'sent' }),
    sendPasswordRecovery: jest
      .fn()
      .mockResolvedValue({ messageId: 'msg_mock_12345', status: 'sent' }),
    sendWelcome: jest
      .fn()
      .mockResolvedValue({ messageId: 'msg_mock_12345', status: 'sent' }),
    sendNotification: jest
      .fn()
      .mockResolvedValue({ messageId: 'msg_mock_12345', status: 'sent' }),
    sendBulk: jest
      .fn()
      .mockResolvedValue([{ messageId: 'msg_mock_12345', status: 'sent' }]),
    verifyEmail: jest.fn().mockResolvedValue(true),
  } as any;
}
