/**
 * @file notification.factory.ts
 * @description Factory for generating test notification data
 * @module test/utils/factories
 * @category Test Utilities
 * @subcategory Notification Factory
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 */

import { v4 as uuid } from 'uuid';

interface INotificationFactoryOptions {
  id?: string;
  userId?: string;
  title?: string;
  message?: string;
  type?: 'SYSTEM' | 'ALERT' | 'INFO' | 'WARNING';
  read?: boolean;
  createdAt?: Date;
}

/**
 * @class NotificationFactory
 * @description Factory for generating test notification data
 */
export class NotificationFactory {
  /**
   * @method create
   * @description Create a single notification
   * @param {INotificationFactoryOptions} overrides - Partial notification data
   * @returns {any} Notification object
   */
  static create(overrides: INotificationFactoryOptions = {}): any {
    const now = new Date();
    return {
      id: overrides.id ?? uuid(),
      userId: overrides.userId ?? uuid(),
      title: overrides.title ?? 'Test Notification',
      message: overrides.message ?? 'This is a test notification',
      type: overrides.type ?? 'INFO',
      read: overrides.read ?? false,
      createdAt: overrides.createdAt ?? now,
    };
  }

  /**
   * @method createMultiple
   * @description Create multiple notifications
   * @param {number} count - Number of notifications
   * @param {INotificationFactoryOptions} overrides - Overrides for all
   * @returns {any[]} Array of notifications
   */
  static createMultiple(count: number, overrides: INotificationFactoryOptions = {}): any[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * @method createUnread
   * @description Create an unread notification
   * @param {INotificationFactoryOptions} overrides - Additional overrides
   * @returns {any} Unread notification
   */
  static createUnread(overrides: INotificationFactoryOptions = {}): any {
    return this.create({ ...overrides, read: false });
  }

  /**
   * @method createAlert
   * @description Create an alert notification
   * @param {INotificationFactoryOptions} overrides - Additional overrides
   * @returns {any} Alert notification
   */
  static createAlert(overrides: INotificationFactoryOptions = {}): any {
    return this.create({ ...overrides, type: 'ALERT' });
  }
}
