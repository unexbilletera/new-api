/**
 * @file logger.mock.ts
 * @description Mock factory for LoggerService - Application logging
 * @module test/utils/mocks
 * @category Test Utilities
 * @subcategory Mocks
 *
 * @author Unex Development Team
 * @since 2.0.0
 */

import { LoggerService } from '../../../src/shared/logger/logger.service';

/**
 * @function createLoggerServiceMock
 * @description Create mocked LoggerService for testing logging behavior
 * @returns {jest.Mocked<LoggerService>} Mocked logger service
 *
 * @example
 * const logger = createLoggerServiceMock();
 * expect(logger.log).toHaveBeenCalledWith('test message');
 */
export function createLoggerServiceMock(): jest.Mocked<LoggerService> {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    fatal: jest.fn(),
    trace: jest.fn(),
    verbose: jest.fn(),
    setContext: jest.fn(),
  } as any;
}
