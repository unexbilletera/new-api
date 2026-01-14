/**
 * @file index.ts
 * @description Central export point for all test utilities
 * @module test/utils
 * @category Test Utilities
 *
 * @author Unex Development Team
 * @since 2.0.0
 *
 * @description
 * Re-exports all test utilities (mocks, fixtures, helpers) for convenient importing.
 *
 * @example
 * import {
 *   createPrismaMock,
 *   createJwtServiceMock,
 *   mockActiveUser,
 *   createTestModule
 * } from '@test/utils';
 */

export { createPrismaMock, resetPrismaMock } from './mocks/prisma.mock';
export { createJwtServiceMock, createValidJwtToken } from './mocks/jwt.mock';
export { createEmailServiceMock } from './mocks/email.mock';
export { createSmsServiceMock } from './mocks/sms.mock';
export { createLoggerServiceMock } from './mocks/logger.mock';

export {
  mockActiveUser,
  mockPendingUser,
  mockLockedUser,
  mockSignupDto,
  mockSigninDto,
  mockUpdateUserProfileDto,
  mockUserAddressDto,
  mockUserAccount,
  mockUserIdentity,
} from './fixtures/user.fixture';

export { UserFactory } from './factories/user.factory';
export { TransactionFactory } from './factories/transaction.factory';
export { NotificationFactory } from './factories/notification.factory';
export { SessionFactory } from './factories/session.factory';
export { BiometricFactory } from './factories/biometric.factory';

export {
  createTestModule,
  createMockProvider,
} from './helpers/test-module.helper';
