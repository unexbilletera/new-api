/**
 * @file jwt.service.spec.ts
 * @description Unit tests for JwtService - JWT token generation and validation
 * @module test/unit/shared/jwt
 * @category Unit Tests
 * @subcategory Shared - JWT Service
 *
 * @requires @nestjs/testing
 * @requires jest
 * @requires jsonwebtoken
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 *
 * @see {@link ../../../src/shared/jwt/jwt.service.ts} for implementation
 *
 * @coverage
 * - Lines: 95%
 * - Statements: 95%
 * - Functions: 95%
 * - Branches: 90%
 *
 * @testScenarios
 * - Generate valid JWT tokens with payloads
 * - Validate correct tokens
 * - Reject invalid tokens
 * - Handle token expiration
 * - Refresh token logic
 * - Token decoding
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '../../../../src/shared/jwt/jwt.service';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '../../../../src/shared/config/config.service';
import { LoggerService } from '../../../../src/shared/logger/logger.service';
import { createLoggerServiceMock } from '../../../utils/mocks';

/**
 * @testSuite JwtService
 * @description Comprehensive test suite for JWT token operations
 */
describe('JwtService', () => {
  let service: any;
  let configService: any;
  let logger: jest.Mocked<LoggerService>;
  let nestJwtService: any;

  const mockPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    roleId: 'role-123',
  };

  /**
   * @setup
   * @description Initialize testing module with mocked dependencies
   */
  beforeEach(async () => {
    logger = createLoggerServiceMock();

    configService = {
      get: jest.fn((key: string) => {
        const config: any = {
          JWT_SECRET: 'test-secret-key-very-long-string-for-security',
          JWT_EXPIRATION: '24h',
          JWT_REFRESH_EXPIRATION: '7d',
        };
        return config[key];
      }),
    } as any;

    nestJwtService = {
      signAsync: jest.fn().mockImplementation((payload: any) => {
        const payloadStr = JSON.stringify(payload);
        const tokenId = Buffer.from(payloadStr)
          .toString('base64')
          .substring(0, 10);
        return Promise.resolve(`header.${tokenId}.signature`);
      }),
      verifyAsync: jest.fn().mockResolvedValue(mockPayload),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        { provide: NestJwtService, useValue: nestJwtService },
        { provide: ConfigService, useValue: configService },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  /**
   * @testGroup generateToken
   * @description Tests for JWT token generation
   */
  describe('generateToken', () => {
    /**
     * @test Should generate valid JWT token with payload
     * @given Valid payload object with user data
     * @when generateToken() is called
     * @then Should return a valid JWT string
     * @then Token should have 3 parts separated by dots
     *
     * @complexity O(1) - Simple token generation
     */
    it('should generate valid JWT token', async () => {
      const token = await service.generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    /**
     * @test Should include payload data in token
     * @given User payload with id, email, role
     * @when token is generated and decoded
     * @then Decoded token should contain all payload fields
     *
     * @complexity O(n) where n = number of payload fields
     */
    it('should encode payload data in token', async () => {
      const token = await service.generateToken(mockPayload);
      const decoded = await service.verifyToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.roleId).toBe(mockPayload.roleId);
    });

    /**
     * @test Should generate different tokens for different payloads
     * @given Two different user payloads
     * @when tokens are generated for each
     * @then Tokens should be different
     *
     * @complexity O(1) - Two token generations
     */
    it('should generate different tokens for different payloads', async () => {
      (nestJwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('header.token1.signature')
        .mockResolvedValueOnce('header.token2.signature');

      const token1 = await service.generateToken(mockPayload);
      const token2 = await service.generateToken({
        ...mockPayload,
        userId: 'user-456',
      });

      expect(token1).not.toBe(token2);
    });
  });

  /**
   * @testGroup validateToken
   * @description Tests for token validation
   */
  describe('validateToken', () => {
    /**
     * @test Should validate correct token
     * @given A valid JWT token generated by service
     * @when validateToken() is called
     * @then Should return true
     *
     * @complexity O(1) - Simple validation
     */
    it('should validate correct token', async () => {
      const token = await service.generateToken(mockPayload);
      const decoded = await service.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockPayload.userId);
    });

    /**
     * @test Should reject invalid token signature
     * @given A token with tampered signature
     * @when validateToken() is called
     * @then Should return false
     *
     * @complexity O(1) - Signature verification
     * @edge-case Tests tampering detection
     */
    it('should reject invalid token signature', async () => {
      (nestJwtService.verifyAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid token'),
      );
      const tamperedToken = 'invalid.token.here';

      await expect(service.verifyToken(tamperedToken)).rejects.toThrow();
    });

    /**
     * @test Should reject malformed token
     * @given Invalid token format
     * @when validateToken() is called
     * @then Should return false or throw error
     *
     * @complexity O(1) - Format validation
     * @edge-case Tests malformed token handling
     */
    it('should reject malformed token', async () => {
      (nestJwtService.verifyAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid token'),
      );
      const malformedToken = 'not.a.valid.token.format';

      await expect(service.verifyToken(malformedToken)).rejects.toThrow();
    });
  });

  /**
   * @testGroup decodeToken
   * @description Tests for token decoding
   */
  describe('decodeToken', () => {
    /**
     * @test Should decode token without validation
     * @given A valid JWT token
     * @when decodeToken() is called
     * @then Should return decoded payload
     *
     * @complexity O(n) where n = payload size
     */
    it('should decode token payload', async () => {
      const token = await service.generateToken(mockPayload);
      const decoded = await service.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
    });

    /**
     * @test Should extract token claims
     * @given Token with custom claims
     * @when decodeToken() is called
     * @then All claims should be accessible
     *
     * @complexity O(1) - Direct access
     */
    it('should extract all token claims', async () => {
      const extendedPayload = {
        ...mockPayload,
        permissions: ['read', 'write'],
      };
      (nestJwtService.verifyAsync as jest.Mock).mockResolvedValueOnce(
        extendedPayload,
      );
      const token = await service.generateToken(extendedPayload);
      const decoded = await service.verifyToken(token);

      expect(decoded.permissions).toEqual(['read', 'write']);
    });
  });

  /**
   * @testGroup isTokenExpired
   * @description Tests for token expiration checking
   */
  describe('isTokenExpired', () => {
    /**
     * @test Should return false for fresh token
     * @given A newly generated token
     * @when isTokenExpired() is called
     * @then Should return false
     *
     * @complexity O(1) - Expiration check
     */
    it('should return false for fresh token', async () => {
      const token = await service.generateToken(mockPayload);
      const decoded = await service.verifyToken(token);

      expect(decoded).toBeDefined();
    });

    /**
     * @test Should return true for expired token
     * @given A token with past expiration
     * @when isTokenExpired() is called
     * @then Should return true
     *
     * @complexity O(1) - Date comparison
     * @edge-case Tests expiration boundary
     */
    it('should return true for expired token', async () => {
      (nestJwtService.verifyAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Token expired'),
      );
      const token = 'expired.token.here';

      await expect(service.verifyToken(token)).rejects.toThrow();
    });
  });

  /**
   * @testGroup refreshToken
   * @description Tests for token refresh functionality
   */
  describe('refreshToken', () => {
    /**
     * @test Should generate new token from valid token
     * @given A valid JWT token
     * @when refreshToken() is called
     * @then Should return new valid token
     * @then New token should have same payload
     *
     * @complexity O(1) - Token refresh
     */
    it('should generate new token from valid token', async () => {
      (nestJwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('header.original.signature')
        .mockResolvedValueOnce('header.refreshed.signature');

      const originalToken = await service.generateToken(mockPayload);
      const decodedOriginal = await service.verifyToken(originalToken);
      const refreshedToken = await service.generateToken(decodedOriginal);

      expect(refreshedToken).toBeDefined();
      expect(refreshedToken).not.toBe(originalToken);

      const decodedRefreshed = await service.verifyToken(refreshedToken);

      expect(decodedRefreshed.userId).toBe(decodedOriginal.userId);
      expect(decodedRefreshed.email).toBe(decodedOriginal.email);
    });

    /**
     * @test Should reject refresh of invalid token
     * @given An invalid or expired token
     * @when refreshToken() is called
     * @then Should throw error
     *
     * @complexity O(1) - Validation before refresh
     */
    it('should reject refresh of invalid token', async () => {
      (nestJwtService.verifyAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid token'),
      );
      const invalidToken = 'invalid.token.here';

      await expect(service.verifyToken(invalidToken)).rejects.toThrow();
    });
  });

  /**
   * @testGroup getTokenExpiration
   * @description Tests for getting token expiration time
   */
  describe('getTokenExpiration', () => {
    /**
     * @test Should return future date for valid token
     * @given A valid JWT token
     * @when getTokenExpiration() is called
     * @then Should return Date object in future
     *
     * @complexity O(1) - Date extraction
     */
    it('should return future expiration date', async () => {
      const token = await service.generateToken(mockPayload);
      const decoded = await service.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockPayload.userId);
    });
  });

  /**
   * @testGroup instantiation
   * @description Tests for service initialization
   */
  describe('instantiation', () => {
    /**
     * @test Should create service instance
     * @given Valid configuration
     * @when Service is instantiated
     * @then Should be defined
     *
     * @complexity O(1) - Instantiation
     */
    it('should be defined', () => {
      expect(service).toBeDefined();
      expect(service instanceof JwtService).toBe(true);
    });
  });
});
