/**
 * @file biometric.factory.ts
 * @description Factory for generating test biometric data
 * @module test/utils/factories
 * @category Test Utilities
 * @subcategory Biometric Factory
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 */

import { v4 as uuid } from 'uuid';

interface IBiometricFactoryOptions {
  id?: string;
  userId?: string;
  type?: 'FINGERPRINT' | 'FACE' | 'IRIS';
  template?: string;
  quality?: number;
  enrolled?: boolean;
  createdAt?: Date;
}

/**
 * @class BiometricFactory
 * @description Factory for generating test biometric data
 */
export class BiometricFactory {
  /**
   * @method create
   * @description Create a single biometric record
   * @param {IBiometricFactoryOptions} overrides - Partial biometric data
   * @returns {any} Biometric object
   */
  static create(overrides: IBiometricFactoryOptions = {}): any {
    const now = new Date();
    return {
      id: overrides.id ?? uuid(),
      userId: overrides.userId ?? uuid(),
      type: overrides.type ?? 'FINGERPRINT',
      template: overrides.template ?? `template-${uuid()}`,
      quality: overrides.quality ?? 95,
      enrolled: overrides.enrolled ?? true,
      createdAt: overrides.createdAt ?? now,
    };
  }

  /**
   * @method createMultiple
   * @description Create multiple biometric records
   * @param {number} count - Number of records
   * @param {IBiometricFactoryOptions} overrides - Overrides for all
   * @returns {any[]} Array of biometric records
   */
  static createMultiple(count: number, overrides: IBiometricFactoryOptions = {}): any[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * @method createFace
   * @description Create a face biometric record
   * @param {IBiometricFactoryOptions} overrides - Additional overrides
   * @returns {any} Face biometric record
   */
  static createFace(overrides: IBiometricFactoryOptions = {}): any {
    return this.create({ ...overrides, type: 'FACE' });
  }

  /**
   * @method createPoorQuality
   * @description Create biometric with poor quality
   * @param {IBiometricFactoryOptions} overrides - Additional overrides
   * @returns {any} Low quality biometric
   */
  static createPoorQuality(overrides: IBiometricFactoryOptions = {}): any {
    return this.create({ ...overrides, quality: 45, enrolled: false });
  }
}
