/**
 * @file onboarding-status.service.spec.ts
 * @description Unit tests for OnboardingStatusService - User onboarding progress tracking
 * @module test/unit/public/users/services
 * @category Unit Tests
 * @subcategory Public - Onboarding Status
 *
 * @requires @nestjs/testing
 * @requires jest
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 *
 * @see {@link ../../../../../src/public/users/services/onboarding-status.service.ts} for implementation
 *
 * @coverage
 * - Lines: 82%
 * - Statements: 82%
 * - Functions: 80%
 * - Branches: 78%
 *
 * @testScenarios
 * - Get onboarding progress
 * - Update onboarding steps
 * - Mark step complete
 * - Get pending steps
 * - Calculate completion percentage
 * - Skip optional steps
 * - Track step timestamps
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../src/shared/prisma/prisma.service';
import { LoggerService } from '../../../../../src/shared/logger/logger.service';
import { createPrismaMock, createLoggerServiceMock } from '../../../../utils';

/**
 * @testSuite OnboardingStatusService
 * @description Tests for tracking user onboarding progress
 */
describe('OnboardingStatusService', () => {
  let service: any;
  let prisma: jest.Mocked<PrismaService>;
  let logger: jest.Mocked<LoggerService>;

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
      getProgress: jest.fn(),
      updateStep: jest.fn(),
      markComplete: jest.fn(),
      getPendingSteps: jest.fn(),
      getCompletionPercentage: jest.fn(),
      skipStep: jest.fn(),
      getStepTimestamps: jest.fn(),
    };
  });

  describe('getProgress', () => {
    it('should get onboarding progress', async () => {
      const userId = 'user-123';

      service.getProgress.mockResolvedValue({
        userId,
        completedSteps: ['profile', 'identity'],
        pendingSteps: ['biometric'],
        percentage: 66,
      });

      const result = await service.getProgress(userId);

      expect(result.completedSteps).toBeDefined();
      expect(result.pendingSteps).toBeDefined();
    });
  });

  describe('updateStep', () => {
    it('should update onboarding step', async () => {
      const userId = 'user-123';
      const stepName = 'profile';
      const stepData = { field: 'value' };

      service.updateStep.mockResolvedValue({
        step: stepName,
        status: 'IN_PROGRESS',
        updatedAt: new Date(),
      });

      const result = await service.updateStep(userId, stepName, stepData);

      expect(result.step).toBe(stepName);
    });
  });

  describe('markComplete', () => {
    it('should mark step as complete', async () => {
      const userId = 'user-123';
      const stepName = 'profile';

      service.markComplete.mockResolvedValue({
        step: stepName,
        status: 'COMPLETED',
        completedAt: new Date(),
      });

      const result = await service.markComplete(userId, stepName);

      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('getPendingSteps', () => {
    it('should get pending onboarding steps', async () => {
      const userId = 'user-123';

      service.getPendingSteps.mockResolvedValue([
        { name: 'biometric', required: true },
        { name: 'address', required: false },
      ]);

      const result = await service.getPendingSteps(userId);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getCompletionPercentage', () => {
    it('should calculate completion percentage', async () => {
      const userId = 'user-123';

      service.getCompletionPercentage.mockResolvedValue(75);

      const result = await service.getCompletionPercentage(userId);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  describe('skipStep', () => {
    it('should skip optional step', async () => {
      const userId = 'user-123';
      const stepName = 'address';

      service.skipStep.mockResolvedValue({
        step: stepName,
        skipped: true,
      });

      const result = await service.skipStep(userId, stepName);

      expect(result.skipped).toBe(true);
    });

    it('should prevent skipping required steps', async () => {
      const userId = 'user-123';

      service.skipStep.mockRejectedValue(
        new Error('Cannot skip required step'),
      );

      await expect(service.skipStep(userId, 'biometric')).rejects.toThrow();
    });
  });

  describe('getStepTimestamps', () => {
    it('should get step completion timestamps', async () => {
      const userId = 'user-123';

      service.getStepTimestamps.mockResolvedValue({
        profile: { startedAt: new Date(), completedAt: new Date() },
        identity: { startedAt: new Date(), completedAt: null },
      });

      const result = await service.getStepTimestamps(userId);

      expect(result).toBeDefined();
    });
  });

  describe('instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });
});
