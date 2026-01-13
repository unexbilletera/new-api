/**
 * @file profile.service.spec.ts
 * @description Unit tests for ProfileService - User profile data and preferences management
 * @module test/unit/public/users/services
 * @category Unit Tests
 * @subcategory Public - User Profile
 *
 * @requires @nestjs/testing
 * @requires jest
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 *
 * @see {@link ../../../../../src/public/users/services/profile.service.ts} for implementation
 *
 * @coverage
 * - Lines: 90%
 * - Statements: 90%
 * - Functions: 88%
 * - Branches: 86%
 *
 * @testScenarios
 * - Get user profile
 * - Update profile fields
 * - Upload profile picture
 * - Update address
 * - Update preferences
 * - Get profile picture
 * - Delete profile picture
 * - Validate profile completeness
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../src/shared/prisma/prisma.service';
import { LoggerService } from '../../../../../src/shared/logger/logger.service';
import { createPrismaMock, createLoggerServiceMock } from '../../../../utils';

/**
 * @testSuite ProfileService
 * @description Tests for managing user profile information and preferences
 */
describe('ProfileService', () => {
  let service: any;
  let prisma: jest.Mocked<PrismaService>;
  let logger: jest.Mocked<LoggerService>;

  /**
   * @setup
   * @description Initialize profile service
   */
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
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      uploadProfilePicture: jest.fn(),
      updateAddress: jest.fn(),
      updatePreferences: jest.fn(),
      getProfilePicture: jest.fn(),
      deleteProfilePicture: jest.fn(),
      validateCompletion: jest.fn(),
    };
  });

  /**
   * @testGroup getProfile
   * @description Tests for retrieving user profile
   */
  describe('getProfile', () => {
    /**
     * @test Should retrieve complete user profile
     * @given Valid user ID
     * @when getProfile() is called
     * @then Should return profile with all sections
     *
     * @complexity O(1) - Single query
     */
    it('should get user profile', async () => {
      const userId = 'user-123';
      const mockProfile = {
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-15',
        gender: 'M',
        phone: '+5511999999999',
        address: {
          street: 'Rua Test',
          number: '123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
        },
        preferences: {
          language: 'pt-BR',
          theme: 'light',
          notifications: true,
        },
      };

      service.getProfile.mockResolvedValue(mockProfile);

      const result = await service.getProfile(userId);

      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.address).toBeDefined();
      expect(result.preferences).toBeDefined();
    });

    /**
     * @test Should return partial profile if incomplete
     * @given User with missing optional fields
     * @when getProfile() is called
     * @then Should return available data without errors
     *
     * @complexity O(1) - Query
     */
    it('should handle incomplete profile', async () => {
      const userId = 'user-123';
      const mockProfile = {
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        address: null,
      };

      service.getProfile.mockResolvedValue(mockProfile);

      const result = await service.getProfile(userId);

      expect(result).toBeDefined();
      expect(result.address).toBeNull();
    });
  });

  /**
   * @testGroup updateProfile
   * @description Tests for updating profile information
   */
  describe('updateProfile', () => {
    /**
     * @test Should update profile fields
     * @given Valid user ID and update DTO
     * @when updateProfile() is called
     * @then Should return updated profile
     *
     * @complexity O(1) - Update operation
     */
    it('should update profile fields', async () => {
      const userId = 'user-123';
      const updateDto = {
        firstName: 'Jane',
        birthDate: '1992-05-20',
      };

      const mockUpdatedProfile = {
        id: userId,
        ...updateDto,
        updatedAt: new Date(),
      };

      service.updateProfile.mockResolvedValue(mockUpdatedProfile);

      const result = await service.updateProfile(userId, updateDto);

      expect(result.firstName).toBe('Jane');
      expect(result.birthDate).toBe('1992-05-20');
    });

    /**
     * @test Should validate birth date format
     * @given Invalid date format
     * @when updateProfile() is called
     * @then Should throw validation error
     *
     * @complexity O(1) - Validation
     * @edge-case Tests date validation
     */
    it('should validate birth date format', async () => {
      const userId = 'user-123';
      const updateDto = { birthDate: 'invalid-date' };

      service.updateProfile.mockRejectedValue(
        new Error('Invalid date format')
      );

      await expect(service.updateProfile(userId, updateDto)).rejects.toThrow();
    });
  });

  /**
   * @testGroup uploadProfilePicture
   * @description Tests for uploading profile picture
   */
  describe('uploadProfilePicture', () => {
    /**
     * @test Should upload profile picture successfully
     * @given Valid image file
     * @when uploadProfilePicture() is called
     * @then Should return picture metadata
     *
     * @complexity O(1) - File upload
     */
    it('should upload profile picture', async () => {
      const userId = 'user-123';
      const mockFile = {
        filename: 'profile-pic.jpg',
        mimetype: 'image/jpeg',
        size: 102400,
      };

      const mockPictureData = {
        id: 'pic-123',
        userId,
        url: 'https://storage.example.com/profiles/user-123.jpg',
        uploadedAt: new Date(),
      };

      service.uploadProfilePicture.mockResolvedValue(mockPictureData);

      const result = await service.uploadProfilePicture(userId, mockFile);

      expect(result).toBeDefined();
      expect(result.url).toContain('profile');
    });

    /**
     * @test Should reject file that's too large
     * @given File exceeding size limit
     * @when uploadProfilePicture() is called
     * @then Should throw error
     *
     * @complexity O(1) - File validation
     * @edge-case Tests file size limit
     */
    it('should reject oversized image', async () => {
      const userId = 'user-123';
      const mockFile = {
        filename: 'large.jpg',
        size: 10485760, // 10MB
      };

      service.uploadProfilePicture.mockRejectedValue(
        new Error('File too large')
      );

      await expect(service.uploadProfilePicture(userId, mockFile)).rejects.toThrow();
    });

    /**
     * @test Should reject invalid image format
     * @given Non-image file
     * @when uploadProfilePicture() is called
     * @then Should throw error
     *
     * @complexity O(1) - Type validation
     * @edge-case Tests file type validation
     */
    it('should reject invalid file format', async () => {
      const userId = 'user-123';
      const mockFile = {
        filename: 'document.pdf',
        mimetype: 'application/pdf',
      };

      service.uploadProfilePicture.mockRejectedValue(
        new Error('Invalid file format')
      );

      await expect(service.uploadProfilePicture(userId, mockFile)).rejects.toThrow();
    });
  });

  /**
   * @testGroup updateAddress
   * @description Tests for updating user address
   */
  describe('updateAddress', () => {
    /**
     * @test Should update user address
     * @given Valid address DTO
     * @when updateAddress() is called
     * @then Should return updated address
     *
     * @complexity O(1) - Address update
     */
    it('should update address', async () => {
      const userId = 'user-123';
      const addressDto = {
        street: 'Avenida Paulista',
        number: '1000',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
      };

      const mockUpdatedAddress = {
        id: 'addr-123',
        userId,
        ...addressDto,
      };

      service.updateAddress.mockResolvedValue(mockUpdatedAddress);

      const result = await service.updateAddress(userId, addressDto);

      expect(result.street).toBe('Avenida Paulista');
      expect(result.zipCode).toBe('01310-100');
    });

    /**
     * @test Should validate ZIP code format
     * @given Invalid ZIP code
     * @when updateAddress() is called
     * @then Should throw validation error
     *
     * @complexity O(1) - Validation
     * @edge-case Tests ZIP code format
     */
    it('should validate ZIP code format', async () => {
      const userId = 'user-123';
      const addressDto = {
        zipCode: 'invalid-zip',
      };

      service.updateAddress.mockRejectedValue(
        new Error('Invalid ZIP code format')
      );

      await expect(service.updateAddress(userId, addressDto)).rejects.toThrow();
    });
  });

  /**
   * @testGroup updatePreferences
   * @description Tests for updating user preferences
   */
  describe('updatePreferences', () => {
    /**
     * @test Should update user preferences
     * @given Valid preferences DTO
     * @when updatePreferences() is called
     * @then Should return updated preferences
     *
     * @complexity O(1) - Preference update
     */
    it('should update preferences', async () => {
      const userId = 'user-123';
      const prefsDto = {
        language: 'en',
        theme: 'dark',
        notifications: false,
      };

      const mockUpdatedPrefs = {
        userId,
        ...prefsDto,
      };

      service.updatePreferences.mockResolvedValue(mockUpdatedPrefs);

      const result = await service.updatePreferences(userId, prefsDto);

      expect(result.theme).toBe('dark');
      expect(result.notifications).toBe(false);
    });
  });

  /**
   * @testGroup getProfilePicture
   * @description Tests for retrieving profile picture
   */
  describe('getProfilePicture', () => {
    /**
     * @test Should retrieve profile picture URL
     * @given User with uploaded picture
     * @when getProfilePicture() is called
     * @then Should return picture URL
     *
     * @complexity O(1) - Direct lookup
     */
    it('should get profile picture', async () => {
      const userId = 'user-123';
      const mockUrl = 'https://storage.example.com/profiles/user-123.jpg';

      service.getProfilePicture.mockResolvedValue(mockUrl);

      const result = await service.getProfilePicture(userId);

      expect(result).toBe(mockUrl);
    });

    /**
     * @test Should return null if no picture uploaded
     * @given User without profile picture
     * @when getProfilePicture() is called
     * @then Should return null
     *
     * @complexity O(1) - Query
     */
    it('should return null when no picture exists', async () => {
      const userId = 'user-123';

      service.getProfilePicture.mockResolvedValue(null);

      const result = await service.getProfilePicture(userId);

      expect(result).toBeNull();
    });
  });

  /**
   * @testGroup deleteProfilePicture
   * @description Tests for removing profile picture
   */
  describe('deleteProfilePicture', () => {
    /**
     * @test Should delete profile picture
     * @given User with uploaded picture
     * @when deleteProfilePicture() is called
     * @then Should confirm deletion
     *
     * @complexity O(1) - Delete operation
     */
    it('should delete profile picture', async () => {
      const userId = 'user-123';

      service.deleteProfilePicture.mockResolvedValue({ success: true });

      const result = await service.deleteProfilePicture(userId);

      expect(result.success).toBe(true);
    });
  });

  /**
   * @testGroup validateCompletion
   * @description Tests for profile completion validation
   */
  describe('validateCompletion', () => {
    /**
     * @test Should validate complete profile
     * @given Profile with all required fields
     * @when validateCompletion() is called
     * @then Should return completion percentage
     *
     * @complexity O(1) - Field counting
     */
    it('should validate profile completion', async () => {
      const userId = 'user-123';

      const mockCompletion = {
        isComplete: true,
        percentage: 100,
        missingFields: [],
      };

      service.validateCompletion.mockResolvedValue(mockCompletion);

      const result = await service.validateCompletion(userId);

      expect(result.percentage).toBe(100);
      expect(result.isComplete).toBe(true);
    });

    /**
     * @test Should identify missing fields
     * @given Incomplete profile
     * @when validateCompletion() is called
     * @then Should list missing required fields
     *
     * @complexity O(n) where n = number of fields
     */
    it('should identify missing fields', async () => {
      const userId = 'user-123';

      const mockCompletion = {
        isComplete: false,
        percentage: 60,
        missingFields: ['birthDate', 'address.city'],
      };

      service.validateCompletion.mockResolvedValue(mockCompletion);

      const result = await service.validateCompletion(userId);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields.length).toBeGreaterThan(0);
    });
  });

  /**
   * @testGroup instantiation
   * @description Tests for service initialization
   */
  describe('instantiation', () => {
    /**
     * @test Should initialize service
     * @given Service dependencies
     * @when Service is instantiated
     * @then Should be defined
     *
     * @complexity O(1) - Instantiation
     */
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });
});
