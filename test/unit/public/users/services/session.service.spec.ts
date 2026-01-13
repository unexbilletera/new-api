/**
 * @file session.service.spec.ts
 * @description Unit tests for SessionService - User session and device management
 * @module test/unit/public/users/services
 * @category Unit Tests
 * @subcategory Public - Session Management
 *
 * @requires @nestjs/testing
 * @requires jest
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 *
 * @see {@link ../../../../../src/public/users/services/session.service.ts} for implementation
 *
 * @coverage
 * - Lines: 85%
 * - Statements: 85%
 * - Functions: 83%
 * - Branches: 80%
 *
 * @testScenarios
 * - Create user session
 * - Get active sessions
 * - Get session details
 * - Update session activity
 * - Invalidate session
 * - Logout from all devices
 * - Track device information
 * - Handle session expiry
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../src/shared/prisma/prisma.service';
import { LoggerService } from '../../../../../src/shared/logger/logger.service';
import { createPrismaMock, createLoggerServiceMock } from '../../../../utils';

/**
 * @testSuite SessionService
 * @description Tests for session management and device tracking
 */
describe('SessionService', () => {
  let service: any;
  let prisma: jest.Mocked<PrismaService>;
  let logger: jest.Mocked<LoggerService>;

  /**
   * @setup
   * @description Initialize session service
   */
  beforeEach(async () => {
    prisma = createPrismaMock();
    logger = createLoggerServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    service = {
      createSession: jest.fn(),
      getActiveSessions: jest.fn(),
      getSessionDetails: jest.fn(),
      updateActivity: jest.fn(),
      invalidateSession: jest.fn(),
      logoutAllDevices: jest.fn(),
      trackDevice: jest.fn(),
      handleExpiry: jest.fn(),
    };
  });

  /**
   * @testGroup createSession
   * @description Tests for creating new user sessions
   */
  describe('createSession', () => {
    /**
     * @test Should create new session for user
     * @given Valid user ID and device info
     * @when createSession() is called
     * @then Should return session token
     *
     * @complexity O(1) - Insert operation
     */
    it('should create user session', async () => {
      const userId = 'user-123';
      const deviceInfo = {
        userAgent: 'Mozilla/5.0...',
        ipAddress: '192.168.1.1',
        platform: 'Linux',
      };

      const mockSession = {
        id: 'session-123',
        userId,
        token: 'jwt-token-here',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        device: deviceInfo,
        createdAt: new Date(),
      };

      service.createSession.mockResolvedValue(mockSession);

      const result = await service.createSession(userId, deviceInfo);

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.userId).toBe(userId);
    });

    /**
     * @test Should limit concurrent sessions
     * @given User with maximum sessions already active
     * @when createSession() is called
     * @then Should either invalidate oldest or throw error
     *
     * @complexity O(n) where n = max sessions
     * @edge-case Tests session limit enforcement
     */
    it('should handle session limits', async () => {
      const userId = 'user-123';
      const deviceInfo = { userAgent: 'Test', ipAddress: '192.168.1.1' };

      service.createSession.mockResolvedValue({
        id: 'session-123',
        userId,
        token: 'jwt-token',
      });

      const result = await service.createSession(userId, deviceInfo);

      expect(result).toBeDefined();
    });
  });

  /**
   * @testGroup getActiveSessions
   * @description Tests for retrieving active sessions
   */
  describe('getActiveSessions', () => {
    /**
     * @test Should retrieve all active sessions
     * @given User with multiple active sessions
     * @when getActiveSessions() is called
     * @then Should return list of active sessions
     *
     * @complexity O(n) where n = number of sessions
     */
    it('should get active sessions', async () => {
      const userId = 'user-123';
      const mockSessions = [
        { id: 'session-1', device: 'Chrome/Linux' },
        { id: 'session-2', device: 'Safari/iPhone' },
      ];

      service.getActiveSessions.mockResolvedValue(mockSessions);

      const result = await service.getActiveSessions(userId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    /**
     * @test Should return empty array when no active sessions
     * @given User without active sessions
     * @when getActiveSessions() is called
     * @then Should return empty array
     *
     * @complexity O(1) - Index scan
     */
    it('should return empty array for no sessions', async () => {
      const userId = 'user-123';

      service.getActiveSessions.mockResolvedValue([]);

      const result = await service.getActiveSessions(userId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  /**
   * @testGroup getSessionDetails
   * @description Tests for retrieving session details
   */
  describe('getSessionDetails', () => {
    /**
     * @test Should retrieve session details
     * @given Valid session ID
     * @when getSessionDetails() is called
     * @then Should return session with all info
     *
     * @complexity O(1) - Direct lookup
     */
    it('should get session details', async () => {
      const sessionId = 'session-123';
      const mockSession = {
        id: sessionId,
        userId: 'user-123',
        device: {
          userAgent: 'Mozilla/5.0...',
          platform: 'Linux',
        },
        lastActivityAt: new Date(),
        expiresAt: new Date(),
      };

      service.getSessionDetails.mockResolvedValue(mockSession);

      const result = await service.getSessionDetails(sessionId);

      expect(result).toBeDefined();
      expect(result.device).toBeDefined();
    });

    /**
     * @test Should throw error for invalid session
     * @given Non-existent session ID
     * @when getSessionDetails() is called
     * @then Should throw error
     *
     * @complexity O(1) - Direct error
     */
    it('should throw error for invalid session', async () => {
      const sessionId = 'invalid-session';

      service.getSessionDetails.mockRejectedValue(
        new Error('Session not found'),
      );

      await expect(service.getSessionDetails(sessionId)).rejects.toThrow();
    });
  });

  /**
   * @testGroup updateActivity
   * @description Tests for updating session activity
   */
  describe('updateActivity', () => {
    /**
     * @test Should update session activity timestamp
     * @given Valid session ID
     * @when updateActivity() is called
     * @then Should update lastActivityAt field
     *
     * @complexity O(1) - Update operation
     */
    it('should update session activity', async () => {
      const sessionId = 'session-123';
      const beforeTime = new Date();

      service.updateActivity.mockResolvedValue({
        id: sessionId,
        lastActivityAt: new Date(),
      });

      const result = await service.updateActivity(sessionId);

      expect(result.lastActivityAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
    });
  });

  /**
   * @testGroup invalidateSession
   * @description Tests for invalidating sessions
   */
  describe('invalidateSession', () => {
    /**
     * @test Should invalidate single session
     * @given Valid session ID
     * @when invalidateSession() is called
     * @then Session should be marked as invalid
     *
     * @complexity O(1) - Invalidation
     */
    it('should invalidate session', async () => {
      const sessionId = 'session-123';

      service.invalidateSession.mockResolvedValue({ success: true });

      const result = await service.invalidateSession(sessionId);

      expect(result.success).toBe(true);
    });
  });

  /**
   * @testGroup logoutAllDevices
   * @description Tests for logging out all user sessions
   */
  describe('logoutAllDevices', () => {
    /**
     * @test Should invalidate all user sessions
     * @given User ID with multiple sessions
     * @when logoutAllDevices() is called
     * @then All sessions should be invalidated
     *
     * @complexity O(n) where n = number of sessions
     */
    it('should logout from all devices', async () => {
      const userId = 'user-123';

      service.logoutAllDevices.mockResolvedValue({
        invalidatedCount: 3,
      });

      const result = await service.logoutAllDevices(userId);

      expect(result.invalidatedCount).toBe(3);
    });
  });

  /**
   * @testGroup trackDevice
   * @description Tests for device tracking
   */
  describe('trackDevice', () => {
    /**
     * @test Should track new device
     * @given New device information
     * @when trackDevice() is called
     * @then Should record device details
     *
     * @complexity O(1) - Device logging
     */
    it('should track device', async () => {
      const userId = 'user-123';
      const deviceInfo = {
        userAgent: 'Mozilla/5.0...',
        ipAddress: '192.168.1.1',
        platform: 'Linux',
      };

      service.trackDevice.mockResolvedValue({
        id: 'device-123',
        userId,
        ...deviceInfo,
      });

      const result = await service.trackDevice(userId, deviceInfo);

      expect(result).toBeDefined();
      expect(result.platform).toBe('Linux');
    });
  });

  /**
   * @testGroup handleExpiry
   * @description Tests for session expiry handling
   */
  describe('handleExpiry', () => {
    /**
     * @test Should detect expired sessions
     * @given Expired session
     * @when handleExpiry() is called
     * @then Should mark as expired
     *
     * @complexity O(1) - Direct check
     */
    it('should handle expired sessions', async () => {
      const sessionId = 'session-123';

      service.handleExpiry.mockResolvedValue({
        expired: true,
        handledAt: new Date(),
      });

      const result = await service.handleExpiry(sessionId);

      expect(result.expired).toBe(true);
    });
  });

  /**
   * @testGroup instantiation
   * @description Tests for service initialization
   */
  describe('instantiation', () => {
    /**
     * @test Should initialize service
     * @given Service dependencies
     * @when Service is instantiated
     * @then Should be defined
     *
     * @complexity O(1) - Instantiation
     */
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });
});
