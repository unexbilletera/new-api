/**
 * @file index.ts
 * @description Central export for test data factories
 * @module test/utils/factories
 * @category Test Utilities
 * @subcategory Factories
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 *
 * @description
 * Re-exports all factory functions for convenient importing.
 * Factories provide reusable test data generation with customizable options.
 *
 * @example
 * import { UserFactory, TransactionFactory } from '@test/utils/factories';
 *
 * const user = UserFactory.create({ email: 'custom@example.com' });
 * const transaction = TransactionFactory.create({ amount: 500 });
 */

export { UserFactory } from './user.factory';
export { TransactionFactory } from './transaction.factory';
export { NotificationFactory } from './notification.factory';
export { SessionFactory } from './session.factory';
export { BiometricFactory } from './biometric.factory';
