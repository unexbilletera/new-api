/**
 * @file jwt.mock.ts
 * @description Mock factory for JwtService - JWT token generation and validation
 * @module test/utils/mocks
 * @category Test Utilities
 * @subcategory Mocks
 *
 * @author Unex Development Team
 * @since 2.0.0
 */

import { JwtService } from '../../../src/shared/jwt/jwt.service';

/**
 * @function createJwtServiceMock
 * @description Create mocked JwtService for testing authentication flows
 * @returns {jest.Mocked<JwtService>} Mocked JWT service
 *
 * @example
 * const jwtService = createJwtServiceMock();
 * jwtService.generateToken.mockResolvedValue('jwt_token_123');
 */
export function createJwtServiceMock(): jest.Mocked<JwtService> {
  return {
    generateToken: jest.fn().mockResolvedValue('jwt_token_mock_12345'),
    validateToken: jest
      .fn()
      .mockResolvedValue({ id: 'user-123', email: 'test@example.com' }),
    decodeToken: jest
      .fn()
      .mockReturnValue({ id: 'user-123', email: 'test@example.com' }),
    refreshToken: jest.fn().mockResolvedValue('jwt_token_refreshed'),
    isTokenExpired: jest.fn().mockReturnValue(false),
    getTokenExpiration: jest
      .fn()
      .mockReturnValue(new Date(Date.now() + 86400000)),
  } as any;
}

/**
 * @function createValidJwtToken
 * @description Create a valid test JWT token with payload
 * @param {object} payload - Token payload
 * @returns {string} Valid JWT token string
 */
export function createValidJwtToken(payload: any): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = 'mock_signature_12345';
  return `${header}.${body}.${signature}`;
}
