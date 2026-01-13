/**
 * @file transaction.factory.ts
 * @description Factory for generating test transaction data
 * @module test/utils/factories
 * @category Test Utilities
 * @subcategory Transaction Factory
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 */

import { v4 as uuid } from 'uuid';

interface ITransactionFactoryOptions {
  id?: string;
  userId?: string;
  amount?: number;
  currency?: string;
  type?: 'TRANSFER' | 'PAYMENT' | 'DEPOSIT' | 'WITHDRAWAL';
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description?: string;
  recipientId?: string;
  createdAt?: Date;
}

/**
 * @class TransactionFactory
 * @description Factory for generating test transaction data
 */
export class TransactionFactory {
  /**
   * @method create
   * @description Create a single transaction with optional overrides
   * @param {ITransactionFactoryOptions} overrides - Partial transaction data
   * @returns {any} Transaction object
   */
  static create(overrides: ITransactionFactoryOptions = {}): any {
    const now = new Date();
    return {
      id: overrides.id ?? uuid(),
      userId: overrides.userId ?? uuid(),
      amount: overrides.amount ?? 100.0,
      currency: overrides.currency ?? 'BRL',
      type: overrides.type ?? 'TRANSFER',
      status: overrides.status ?? 'COMPLETED',
      description: overrides.description ?? 'Test transaction',
      recipientId: overrides.recipientId ?? uuid(),
      createdAt: overrides.createdAt ?? now,
    };
  }

  /**
   * @method createMultiple
   * @description Create multiple transactions
   * @param {number} count - Number of transactions
   * @param {ITransactionFactoryOptions} overrides - Overrides for all transactions
   * @returns {any[]} Array of transactions
   */
  static createMultiple(count: number, overrides: ITransactionFactoryOptions = {}): any[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * @method createPending
   * @description Create a pending transaction
   * @param {ITransactionFactoryOptions} overrides - Additional overrides
   * @returns {any} Pending transaction
   */
  static createPending(overrides: ITransactionFactoryOptions = {}): any {
    return this.create({ ...overrides, status: 'PENDING' });
  }

  /**
   * @method createFailed
   * @description Create a failed transaction
   * @param {ITransactionFactoryOptions} overrides - Additional overrides
   * @returns {any} Failed transaction
   */
  static createFailed(overrides: ITransactionFactoryOptions = {}): any {
    return this.create({ ...overrides, status: 'FAILED' });
  }
}
