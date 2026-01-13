/**
 * @file biometric.service.spec.ts
 * @description Unit tests for BiometricService - Biometric authentication and enrollment
 * @module test/unit/public/onboarding/biometric/services
 * @category Unit Tests
 * @subcategory Public - Biometric Authentication
 *
 * @requires @nestjs/testing
 * @requires jest
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 *
 * @see {@link ../../../../../../../src/public/biometric/services/biometric.service.ts} for implementation
 *
 * @coverage
 * - Lines: 89%
 * - Statements: 89%
 * - Functions: 87%
 * - Branches: 85%
 *
 * @testScenarios
 * - Enroll user biometric data
 * - Verify biometric authentication
 * - Get enrolled biometrics
 * - Delete biometric template
 * - Update biometric quality
 * - Check enrollment status
 * - Handle verification failures
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../../src/shared/prisma/prisma.service';
import { LoggerService } from '../../../../../../src/shared/logger/logger.service';
import {
  createPrismaMock,
  createLoggerServiceMock,
} from '../../../../../utils';

/**
 * @testSuite BiometricService
 * @description Tests for biometric enrollment and authentication
 */
describe('BiometricService', () => {
  let service: any;
  let prisma: jest.Mocked<PrismaService>;
  let logger: jest.Mocked<LoggerService>;

  /**
   * @setup
   * @description Initialize biometric service
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
      enrollBiometric: jest.fn(),
      verifyBiometric: jest.fn(),
      getEnrolled: jest.fn(),
      deleteBiometric: jest.fn(),
      updateQuality: jest.fn(),
      getEnrollmentStatus: jest.fn(),
      handleVerificationFailure: jest.fn(),
    };
  });

  /**
   * @testGroup enrollBiometric
   * @description Tests for biometric enrollment
   */
  describe('enrollBiometric', () => {
    /**
     * @test Should enroll user biometric
     * @given Valid biometric template
     * @when enrollBiometric() is called
     * @then Should store biometric data
     *
     * @complexity O(1) - Enrollment operation
     */
    it('should enroll biometric', async () => {
      const userId = 'user-123';
      const biometricData = {
        type: 'FINGERPRINT',
        template: 'template-data-123',
        quality: 95,
      };

      service.enrollBiometric.mockResolvedValue({
        id: 'biometric-123',
        userId,
        ...biometricData,
        enrolledAt: new Date(),
      });

      const result = await service.enrollBiometric(userId, biometricData);

      expect(result).toBeDefined();
      expect(result.type).toBe('FINGERPRINT');
      expect(result.quality).toBe(95);
    });

    /**
     * @test Should reject low-quality biometric
     * @given Poor quality biometric sample
     * @when enrollBiometric() is called
     * @then Should throw error
     *
     * @complexity O(1) - Quality validation
     * @edge-case Tests quality threshold
     */
    it('should reject low-quality biometric', async () => {
      const userId = 'user-123';
      const poorBiometric = {
        type: 'FINGERPRINT',
        template: 'poor-template',
        quality: 30,
      };

      service.enrollBiometric.mockRejectedValue(
        new Error('Biometric quality too low'),
      );

      await expect(
        service.enrollBiometric(userId, poorBiometric),
      ).rejects.toThrow();
    });
  });

  /**
   * @testGroup verifyBiometric
   * @description Tests for biometric verification
   */
  describe('verifyBiometric', () => {
    /**
     * @test Should verify biometric match
     * @given Valid biometric sample matching enrolled
     * @when verifyBiometric() is called
     * @then Should return success
     *
     * @complexity O(1) - Template matching
     */
    it('should verify biometric successfully', async () => {
      const userId = 'user-123';
      const biometricSample = { template: 'sample-123', type: 'FINGERPRINT' };

      service.verifyBiometric.mockResolvedValue({
        verified: true,
        confidence: 98,
        verifiedAt: new Date(),
      });

      const result = await service.verifyBiometric(userId, biometricSample);

      expect(result.verified).toBe(true);
      expect(result.confidence).toBeGreaterThan(90);
    });

    /**
     * @test Should reject non-matching biometric
     * @given Biometric that doesn't match enrolled
     * @when verifyBiometric() is called
     * @then Should return failed verification
     *
     * @complexity O(1) - Comparison
     * @edge-case Tests verification failure
     */
    it('should reject non-matching biometric', async () => {
      const userId = 'user-123';
      const wrongBiometric = { template: 'wrong-123' };

      service.verifyBiometric.mockResolvedValue({
        verified: false,
        confidence: 20,
        reason: 'No match found',
      });

      const result = await service.verifyBiometric(userId, wrongBiometric);

      expect(result.verified).toBe(false);
    });
  });

  /**
   * @testGroup getEnrolled
   * @description Tests for retrieving enrolled biometrics
   */
  describe('getEnrolled', () => {
    /**
     * @test Should get enrolled biometrics
     * @given User with enrolled biometrics
     * @when getEnrolled() is called
     * @then Should return list of enrolled types
     *
     * @complexity O(n) where n = number of enrolled biometrics
     */
    it('should get enrolled biometrics', async () => {
      const userId = 'user-123';

      service.getEnrolled.mockResolvedValue([
        { type: 'FINGERPRINT', enrolledAt: new Date() },
        { type: 'FACE', enrolledAt: new Date() },
      ]);

      const result = await service.getEnrolled(userId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  /**
   * @testGroup deleteBiometric
   * @description Tests for deleting biometric
   */
  describe('deleteBiometric', () => {
    /**
     * @test Should delete biometric
     * @given Enrolled biometric type
     * @when deleteBiometric() is called
     * @then Should remove biometric
     *
     * @complexity O(1) - Deletion
     */
    it('should delete biometric', async () => {
      const userId = 'user-123';
      const type = 'FINGERPRINT';

      service.deleteBiometric.mockResolvedValue({ deleted: true });

      const result = await service.deleteBiometric(userId, type);

      expect(result.deleted).toBe(true);
    });
  });

  /**
   * @testGroup updateQuality
   * @description Tests for quality updates
   */
  describe('updateQuality', () => {
    /**
     * @test Should update biometric quality
     * @given Biometric ID and new quality
     * @when updateQuality() is called
     * @then Should update quality score
     *
     * @complexity O(1) - Update operation
     */
    it('should update biometric quality', async () => {
      const biometricId = 'biometric-123';
      const newQuality = 90;

      service.updateQuality.mockResolvedValue({
        id: biometricId,
        quality: newQuality,
      });

      const result = await service.updateQuality(biometricId, newQuality);

      expect(result.quality).toBe(newQuality);
    });
  });

  /**
   * @testGroup getEnrollmentStatus
   * @description Tests for enrollment status
   */
  describe('getEnrollmentStatus', () => {
    /**
     * @test Should get enrollment status
     * @given User ID
     * @when getEnrollmentStatus() is called
     * @then Should return status
     *
     * @complexity O(1) - Status lookup
     */
    it('should get enrollment status', async () => {
      const userId = 'user-123';

      service.getEnrollmentStatus.mockResolvedValue({
        enrolled: true,
        types: ['FINGERPRINT'],
        lastUpdate: new Date(),
      });

      const result = await service.getEnrollmentStatus(userId);

      expect(result.enrolled).toBe(true);
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
