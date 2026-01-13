/**
 * @file prisma.mock.ts
 * @description Mock factory for PrismaService - provides reusable mocked Prisma client
 * @module test/utils/mocks
 * @category Test Utilities
 * @subcategory Mocks
 *
 * @requires jest
 * @requires @prisma/client
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 *
 * @description
 * Provides pre-configured jest mock objects for all Prisma entities.
 * Used to mock database operations in service and controller tests.
 *
 * @example
 * const prisma = createPrismaMock();
 * prisma.users.findUnique.mockResolvedValue(mockUser);
 * const service = new UserService(prisma);
 * const result = await service.getUser(userId);
 */

import { PrismaService } from '../../../src/shared/prisma/prisma.service';

/**
 * @function createPrismaMock
 * @description Factory function to create a fully mocked PrismaService
 * @returns {jest.Mocked<PrismaService>} Mocked Prisma service with all entities mocked
 *
 * @example
 * const prisma = createPrismaMock();
 * prisma.users.findUnique.mockResolvedValue(mockUser);
 */
export function createPrismaMock(): jest.Mocked<PrismaService> {
  return {
    // User entities
    users: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },

    // Authentication entities
    email_validation_codes: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    phone_validation_codes: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    password_recovery_codes: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },

    // Account entities
    user_accounts: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user_identities: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },

    // Transaction entities
    transactions: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    pix_transactions: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },

    // Notification entities
    notifications: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification_templates: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },

    // Campaign entities
    campaigns: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    campaign_codes: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },

    // Terms entities
    terms_conditions: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },

    // Session entities
    sessions: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },

    // Access log entities
    access_logs: {
      create: jest.fn(),
    },

    // General utilities
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn(),
  } as any;
}

/**
 * @function resetPrismaMock
 * @description Reset all Prisma mock calls
 * @param {jest.Mocked<PrismaService>} prisma - The mocked Prisma service
 *
 * @example
 * const prisma = createPrismaMock();
 * // ... run some tests ...
 * resetPrismaMock(prisma);
 */
export function resetPrismaMock(prisma: jest.Mocked<PrismaService>): void {
  jest.clearAllMocks();
}
