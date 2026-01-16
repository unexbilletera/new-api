/**
 * @file user-profile.dto.spec.ts
 * @description Unit tests for UserProfileDto validation
 * @module test/unit/public/users/dto
 * @category Unit Tests
 * @subcategory DTOs - Validation
 *
 * @requires class-validator
 * @requires jest
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-14
 *
 * @see {@link ../../../../../src/public/users/dto/user-profile.dto.ts} for implementation
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateUserProfileDto } from '../../../../../src/public/users/dto/user-profile.dto';

/**
 * @testSuite UpdateUserProfileDto Validation
 * @description Comprehensive validation tests for user profile update DTO
 */
describe('UpdateUserProfileDto Validation', () => {
  /**
   * @testGroup Birthdate Field Validation
   * @description Tests for strict YYYY-MM-DD format validation
   */
  describe('Birthdate Field Validation', () => {
    /**
     * @test Should accept valid YYYY-MM-DD format
     * @given A valid birthdate in YYYY-MM-DD format
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should accept valid YYYY-MM-DD format (2004-10-29)', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        birthdate: '2004-10-29',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    /**
     * @test Should accept various valid dates
     * @given Different valid YYYY-MM-DD dates
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should accept various valid dates in YYYY-MM-DD format', async () => {
      const validDates = [
        '1990-01-15',
        '2000-12-31',
        '1985-06-20',
        '2023-03-01',
      ];

      for (const date of validDates) {
        const dto = plainToInstance(UpdateUserProfileDto, {
          birthdate: date,
        });

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      }
    });

    /**
     * @test Should reject MM-DD-YYYY format (10-29-2004)
     * @given A birthdate in MM-DD-YYYY format
     * @when validate() is called
     * @then Should have validation error for Matches
     */
    it('should reject MM-DD-YYYY format (10-29-2004)', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        birthdate: '10-29-2004',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('birthdate');
      expect(errors[0].constraints).toHaveProperty('matches');
      expect(errors[0].constraints?.matches).toContain('YYYY-MM-DD');
    });

    /**
     * @test Should reject DD-MM-YYYY format (29-10-2004)
     * @given A birthdate in DD-MM-YYYY format
     * @when validate() is called
     * @then Should have validation error for Matches
     */
    it('should reject DD-MM-YYYY format (29-10-2004)', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        birthdate: '29-10-2004',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('birthdate');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    /**
     * @test Should reject date with slashes (10/29/2004)
     * @given A birthdate with slashes instead of dashes
     * @when validate() is called
     * @then Should have validation error for Matches
     */
    it('should reject date with slashes (10/29/2004)', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        birthdate: '10/29/2004',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('birthdate');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    /**
     * @test Should reject date with single digits (2004-1-5)
     * @given A birthdate with single digit month/day
     * @when validate() is called
     * @then Should have validation error for Matches
     */
    it('should reject date with single digits (2004-1-5)', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        birthdate: '2004-1-5',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('birthdate');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    /**
     * @test Should accept YYYY-MM-DD format even with logical invalid dates
     * @given A birthdate with format YYYY-MM-DD but logically invalid values (month 13, day 32)
     * @when validate() is called
     * @then Should have no validation errors (format regex doesn't validate logic, only format)
     * @note The regex validates format only, not if the date actually exists
     */
    it('should accept format YYYY-MM-DD even with invalid month/day (2004-13-32)', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        birthdate: '2004-13-32',
      });

      const errors = await validate(dto);

      // The Matches validator only checks the format, not if the date is logically valid
      expect(errors).toHaveLength(0);
    });

    /**
     * @test Should reject arbitrary text
     * @given A non-date string
     * @when validate() is called
     * @then Should have validation error for Matches
     */
    it('should reject arbitrary text (invalid-date)', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        birthdate: 'invalid-date',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('birthdate');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    /**
     * @test Should reject empty string
     * @given An empty string for birthdate
     * @when validate() is called
     * @then Should have validation error for Matches
     */
    it('should reject empty string', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        birthdate: '',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('birthdate');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    /**
     * @test Should accept undefined (optional field)
     * @given No birthdate provided
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should accept undefined birthdate (optional field)', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    /**
     * @test Should accept null (optional field)
     * @given Null value for birthdate
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should accept null birthdate (optional field)', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        birthdate: null,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    /**
     * @test Should reject non-string type
     * @given A number instead of string
     * @when validate() is called
     * @then Should have validation error for IsString
     */
    it('should reject non-string type (number)', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        birthdate: 20041029,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'birthdate')).toBe(true);
    });
  });

  /**
   * @testGroup Phone Field Validation
   * @description Tests for phone format validation
   */
  describe('Phone Field Validation', () => {
    /**
     * @test Should accept valid phone format with +
     * @given A valid international phone number
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should accept valid phone format (+5511987654321)', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        phone: '+5511987654321',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    /**
     * @test Should reject phone without +
     * @given A phone number without + prefix
     * @when validate() is called
     * @then Should have validation error
     */
    it('should reject phone without + (5511987654321)', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        phone: '5511987654321',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('phone');
      expect(errors[0].constraints).toHaveProperty('matches');
    });
  });

  /**
   * @testGroup Multiple Fields Validation
   * @description Tests for validating multiple fields together
   */
  describe('Multiple Fields Validation', () => {
    /**
     * @test Should validate all fields together
     * @given Multiple valid fields
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should validate all fields together', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        firstName: 'John',
        lastName: 'Doe',
        birthdate: '1990-01-15',
        phone: '+5511987654321',
        language: 'pt',
        timezone: 'America/Sao_Paulo',
        country: 'BR',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    /**
     * @test Should catch multiple validation errors
     * @given Multiple invalid fields
     * @when validate() is called
     * @then Should have validation errors for invalid fields only
     */
    it('should catch multiple validation errors', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        birthdate: '10-29-2004', // Invalid format
        phone: '5511987654321', // Missing +
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThanOrEqual(2);
      const birthdateError = errors.find((e) => e.property === 'birthdate');
      const phoneError = errors.find((e) => e.property === 'phone');
      expect(birthdateError).toBeDefined();
      expect(phoneError).toBeDefined();
    });
  });
});
