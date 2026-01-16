/**
 * @file user.factory.ts
 * @description Factory for generating test user data with customizable options
 * @module test/utils/factories
 * @category Test Utilities
 * @subcategory User Factory
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 *
 * @description
 * Provides factory methods to generate realistic test user objects.
 * Supports partial overrides and bulk creation.
 *
 * @example
 * const user = UserFactory.create();
 * const adminUser = UserFactory.create({ role: 'ADMIN', email: 'admin@test.com' });
 * const users = UserFactory.createMultiple(5);
 * const userWithAccount = UserFactory.createWithAccount();
 */

import { v4 as uuid } from 'uuid';

/**
 * @interface IUserFactoryOptions
 * @description Options to customize generated user data
 */
interface IUserFactoryOptions {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: 'ACTIVE' | 'PENDING' | 'LOCKED' | 'SUSPENDED';
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @class UserFactory
 * @description Factory class for generating test user objects
 * @static
 */
export class UserFactory {
  /**
   * @method create
   * @description Create a single user with optional overrides
   * @param {IUserFactoryOptions} overrides - Partial user data to override defaults
   * @returns {any} User object with merged default and override data
   *
   * @example
   * const user = UserFactory.create({ email: 'custom@test.com' });
   */
  static create(overrides: IUserFactoryOptions = {}): any {
    const now = new Date();
    return {
      id: overrides.id ?? uuid(),
      email: overrides.email ?? `user-${uuid().slice(0, 8)}@test.com`,
      firstName: overrides.firstName ?? 'Test',
      lastName: overrides.lastName ?? 'User',
      phone: overrides.phone ?? '+5511999999999',
      status: overrides.status ?? 'ACTIVE',
      role: overrides.role ?? 'USER',
      emailVerified: overrides.emailVerified ?? true,
      phoneVerified: overrides.phoneVerified ?? false,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    };
  }

  /**
   * @method createMultiple
   * @description Create multiple users with optional overrides
   * @param {number} count - Number of users to create
   * @param {IUserFactoryOptions} overrides - Overrides applied to all users
   * @returns {any[]} Array of user objects
   *
   * @example
   * const users = UserFactory.createMultiple(5);
   * const adminUsers = UserFactory.createMultiple(3, { role: 'ADMIN' });
   */
  static createMultiple(
    count: number,
    overrides: IUserFactoryOptions = {},
  ): any[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * @method createWithAccount
   * @description Create user with nested account data
   * @param {IUserFactoryOptions} overrides - User overrides
   * @returns {any} User object with embedded account
   *
   * @example
   * const userWithAccount = UserFactory.createWithAccount();
   */
  static createWithAccount(overrides: IUserFactoryOptions = {}): any {
    return {
      ...this.create(overrides),
      account: {
        id: uuid(),
        accountNumber: '123456789',
        balance: 5000,
        currency: 'BRL',
        status: 'ACTIVE',
      },
    };
  }

  /**
   * @method createInactive
   * @description Create an inactive/locked user
   * @param {IUserFactoryOptions} overrides - Additional overrides
   * @returns {any} Inactive user object
   *
   * @example
   * const lockedUser = UserFactory.createInactive();
   */
  static createInactive(overrides: IUserFactoryOptions = {}): any {
    return this.create({
      ...overrides,
      status: 'LOCKED',
      emailVerified: false,
    });
  }

  /**
   * @method createAdmin
   * @description Create an admin user
   * @param {IUserFactoryOptions} overrides - Additional overrides
   * @returns {any} Admin user object
   *
   * @example
   * const admin = UserFactory.createAdmin();
   */
  static createAdmin(overrides: IUserFactoryOptions = {}): any {
    return this.create({ ...overrides, role: 'ADMIN' });
  }
}
