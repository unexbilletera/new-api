/**
 * @file session.factory.ts
 * @description Factory for generating test session data
 * @module test/utils/factories
 * @category Test Utilities
 * @subcategory Session Factory
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 */

import { v4 as uuid } from 'uuid';

interface ISessionFactoryOptions {
  id?: string;
  userId?: string;
  token?: string;
  device?: string;
  ipAddress?: string;
  expiresAt?: Date;
  createdAt?: Date;
}

/**
 * @class SessionFactory
 * @description Factory for generating test session data
 */
export class SessionFactory {
  /**
   * @method create
   * @description Create a single session
   * @param {ISessionFactoryOptions} overrides - Partial session data
   * @returns {any} Session object
   */
  static create(overrides: ISessionFactoryOptions = {}): any {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    return {
      id: overrides.id ?? uuid(),
      userId: overrides.userId ?? uuid(),
      token: overrides.token ?? `token-${uuid()}`,
      device: overrides.device ?? 'Chrome/Linux',
      ipAddress: overrides.ipAddress ?? '192.168.1.1',
      expiresAt: overrides.expiresAt ?? expiresAt,
      createdAt: overrides.createdAt ?? now,
    };
  }

  /**
   * @method createMultiple
   * @description Create multiple sessions
   * @param {number} count - Number of sessions
   * @param {ISessionFactoryOptions} overrides - Overrides for all
   * @returns {any[]} Array of sessions
   */
  static createMultiple(count: number, overrides: ISessionFactoryOptions = {}): any[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * @method createExpired
   * @description Create an expired session
   * @param {ISessionFactoryOptions} overrides - Additional overrides
   * @returns {any} Expired session
   */
  static createExpired(overrides: ISessionFactoryOptions = {}): any {
    const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    return this.create({ ...overrides, expiresAt: pastDate });
  }
}
