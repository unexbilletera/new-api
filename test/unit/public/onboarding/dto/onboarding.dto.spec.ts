/**
 * @file onboarding.dto.spec.ts
 * @description Unit tests for Onboarding DTO validation
 * @module test/unit/public/onboarding/dto
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
 * @see {@link ../../../../../src/public/onboarding/dto/onboarding.dto.ts} for implementation
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  UpdateUserOnboardingDto,
  UpdateIdentityOnboardingDto,
} from '../../../../../src/public/onboarding/dto/onboarding.dto';

/**
 * @testSuite UpdateUserOnboardingDto Validation
 * @description Comprehensive validation tests for user onboarding update DTO
 */
describe('UpdateUserOnboardingDto Validation', () => {
  /**
   * @testGroup Birthdate Field Validation
   * @description Tests for strict YYYY-MM-DD format validation in onboarding
   */
  describe('Birthdate Field Validation', () => {
    /**
     * @test Should accept valid YYYY-MM-DD format
     * @given A valid birthdate in YYYY-MM-DD format
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should accept valid YYYY-MM-DD format (2004-10-29)', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
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
        const dto = plainToInstance(UpdateUserOnboardingDto, {
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
      const dto = plainToInstance(UpdateUserOnboardingDto, {
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
      const dto = plainToInstance(UpdateUserOnboardingDto, {
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
      const dto = plainToInstance(UpdateUserOnboardingDto, {
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
      const dto = plainToInstance(UpdateUserOnboardingDto, {
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
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        birthdate: '2004-13-32',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    /**
     * @test Should reject arbitrary text
     * @given A non-date string
     * @when validate() is called
     * @then Should have validation error for Matches
     */
    it('should reject arbitrary text (invalid-date)', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
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
      const dto = plainToInstance(UpdateUserOnboardingDto, {
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
      const dto = plainToInstance(UpdateUserOnboardingDto, {});

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
      const dto = plainToInstance(UpdateUserOnboardingDto, {
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
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        birthdate: 20041029,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'birthdate')).toBe(true);
    });
  });

  /**
   * @testGroup Phone Field Validation
   * @description Tests for phone format validation in onboarding
   */
  describe('Phone Field Validation', () => {
    /**
     * @test Should accept valid phone format with +
     * @given A valid international phone number
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should accept valid phone format (+5511987654321)', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
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
      const dto = plainToInstance(UpdateUserOnboardingDto, {
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
   * @description Tests for validating multiple fields together in onboarding
   */
  describe('Multiple Fields Validation', () => {
    /**
     * @test Should validate all fields together
     * @given Multiple valid fields in onboarding DTO
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should validate all fields together', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        firstName: 'John',
        lastName: 'Doe',
        birthdate: '1990-01-15',
        phone: '+5511987654321',
        gender: 'male',
        maritalStatus: 'single',
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
      const dto = plainToInstance(UpdateUserOnboardingDto, {
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

    /**
     * @test Should validate onboarding with birthdate in correct format
     * @given A complete onboarding update with valid data
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should validate complete onboarding update with correct birthdate', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        firstName: 'Ellen',
        lastName: 'Silva',
        birthdate: '2004-10-29',
        phone: '+5511987654321',
        gender: 'female',
        maritalStatus: 'single',
        country: 'BR',
        campaignCode: 'CAMPAIGN123',
        cpf: '12345678900',
        address: {
          street: 'Avenida Paulista',
          number: '1578',
          city: 'Sao Paulo',
          state: 'SP',
          zipCode: '01310-100',
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  /**
   * @testGroup Liveness Image Field Validation
   * @description Tests for base64 image data URL validation
   */
  describe('Liveness Image Field Validation', () => {
    /**
     * @test Should accept valid JPEG base64 image
     * @given A valid base64 JPEG data URL
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should accept valid JPEG base64 image', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        livenessImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRg',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    /**
     * @test Should accept valid PNG base64 image
     * @given A valid base64 PNG data URL
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should accept valid PNG base64 image', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        livenessImage:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    /**
     * @test Should reject image without data URL prefix
     * @given A base64 string without the data URL prefix
     * @when validate() is called
     * @then Should have validation error for Matches
     */
    it('should reject image without data URL prefix', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        livenessImage: '/9j/4AAQSkZJRg',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('livenessImage');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    /**
     * @test Should reject image with incorrect MIME type
     * @given A data URL with non-image MIME type
     * @when validate() is called
     * @then Should have validation error for Matches
     */
    it('should reject image with incorrect MIME type', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        livenessImage: 'data:text/plain;base64,aGVsbG8gd29ybGQ=',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('livenessImage');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    /**
     * @test Should reject image without base64 indicator
     * @given A data URL without ;base64, separator
     * @when validate() is called
     * @then Should have validation error for Matches
     */
    it('should reject image without base64 indicator', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        livenessImage: 'data:image/jpeg,/9j/4AAQSkZJRg',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('livenessImage');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    /**
     * @test Should reject plain text
     * @given A plain text string instead of data URL
     * @when validate() is called
     * @then Should have validation error for Matches
     */
    it('should reject plain text', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        livenessImage: 'not-a-valid-image',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('livenessImage');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    /**
     * @test Should reject empty string
     * @given An empty string for livenessImage
     * @when validate() is called
     * @then Should have validation error for Matches
     */
    it('should reject empty string', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        livenessImage: '',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('livenessImage');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    /**
     * @test Should accept undefined (optional field)
     * @given No livenessImage provided
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should accept undefined livenessImage (optional field)', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    /**
     * @test Should accept null (optional field)
     * @given Null value for livenessImage
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should accept null livenessImage (optional field)', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        livenessImage: null,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('PEP and pepSince Validation', () => {
    /**
     * @test Should allow pep = "0" without pepSince
     * @given A DTO with pep = "0" and no pepSince
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should allow pep = "0" without pepSince', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        firstName: 'John',
        pep: '0',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    /**
     * @test Should require pepSince when pep = "1"
     * @given A DTO with pep = "1" but no pepSince
     * @when validate() is called
     * @then Should have validation error for pepSince
     */
    it('should require pepSince when pep = "1"', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        firstName: 'John',
        pep: '1',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const pepSinceError = errors.find((e) => e.property === 'pepSince');
      expect(pepSinceError).toBeDefined();
      expect(pepSinceError?.constraints).toHaveProperty('isNotEmpty');
    });

    /**
     * @test Should allow pep = "1" with valid pepSince
     * @given A DTO with pep = "1" and valid pepSince date
     * @when validate() is called
     * @then Should have no validation errors
     */
    it('should allow pep = "1" with valid pepSince', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        firstName: 'John',
        pep: '1',
        pepSince: '2020-01-15',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    /**
     * @test Should reject invalid pepSince format
     * @given A DTO with pep = "1" and invalid pepSince format
     * @when validate() is called
     * @then Should have validation error for pepSince format
     */
    it('should reject invalid pepSince format when pep = "1"', async () => {
      const dto = plainToInstance(UpdateUserOnboardingDto, {
        firstName: 'John',
        pep: '1',
        pepSince: '15/01/2020', // Invalid format
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const pepSinceError = errors.find((e) => e.property === 'pepSince');
      expect(pepSinceError).toBeDefined();
      expect(pepSinceError?.constraints).toHaveProperty('matches');
    });
  });
});

describe('UpdateIdentityOnboardingDto Validation', () => {
  describe('CPF Field Validation', () => {
    it('should accept valid CPF format (11 digits)', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {
        cpf: '12345678900',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject CPF with formatting (dots and dashes)', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {
        cpf: '123.456.789-00',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('cpf');
    });

    it('should reject CPF with less than 11 digits', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {
        cpf: '1234567890',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept undefined CPF (optional field)', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('RG Field Validation', () => {
    it('should accept valid RG number', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {
        rg: 'MG1234567',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept RG with different state formats', async () => {
      const validRGs = ['SP123456789', 'RJ987654', 'MG1234567'];

      for (const rg of validRGs) {
        const dto = plainToInstance(UpdateIdentityOnboardingDto, {
          rg,
        });

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      }
    });

    it('should accept undefined RG (optional field)', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('RG Issuer Field Validation', () => {
    it('should accept valid RG issuer (SSP-SP)', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {
        rgIssuer: 'SSP-SP',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept various RG issuers', async () => {
      const validIssuers = ['SSP-SP', 'DETRAN-MG', 'SSP-RJ', 'DETRAN-BA'];

      for (const issuer of validIssuers) {
        const dto = plainToInstance(UpdateIdentityOnboardingDto, {
          rgIssuer: issuer,
        });

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      }
    });

    it('should accept undefined rgIssuer (optional field)', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('RG Expiration Field Validation', () => {
    it('should accept valid YYYY-MM-DD format for rgExpiration', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {
        rgExpiration: '2030-12-31',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject invalid date format for rgExpiration', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {
        rgExpiration: '31-12-2030',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const rgExpirationError = errors.find(
        (e) => e.property === 'rgExpiration',
      );
      expect(rgExpirationError).toBeDefined();
    });

    it('should accept undefined rgExpiration (optional field)', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('CPF and RG Together', () => {
    it('should accept valid CPF and RG together', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {
        cpf: '12345678900',
        rg: 'MG1234567',
        rgIssuer: 'SSP-SP',
        rgExpiration: '2030-12-31',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept only CPF', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {
        cpf: '12345678900',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept only RG with issuer and expiration', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {
        rg: 'MG1234567',
        rgIssuer: 'SSP-SP',
        rgExpiration: '2030-12-31',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('Legacy Compatibility Fields', () => {
    it('should accept deprecated documentNumber field', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {
        documentNumber: '12345678900',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept deprecated documentIssuer field', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {
        documentIssuer: 'SSP-SP',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept deprecated documentExpiration field', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {
        documentExpiration: '2030-12-31',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept all legacy fields together', async () => {
      const dto = plainToInstance(UpdateIdentityOnboardingDto, {
        documentNumber: '12345678900',
        documentIssuer: 'SSP-SP',
        documentExpiration: '2030-12-31',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });
});
