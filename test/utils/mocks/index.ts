/**
 * @file index.ts
 * @description Central export point for all test mocks
 * @module test/utils/mocks
 * @category Test Utilities
 *
 * @author Unex Development Team
 * @since 2.0.0
 *
 * @description
 * Centralizes and re-exports all mock factories for easy importing in test files.
 *
 * @example
 * import { createPrismaMock, createJwtServiceMock } from '@test/utils/mocks';
 * const prisma = createPrismaMock();
 * const jwt = createJwtServiceMock();
 */

export { createPrismaMock, resetPrismaMock } from './prisma.mock';
export { createJwtServiceMock, createValidJwtToken } from './jwt.mock';
export { createEmailServiceMock } from './email.mock';
export { createSmsServiceMock } from './sms.mock';
export { createLoggerServiceMock } from './logger.mock';
