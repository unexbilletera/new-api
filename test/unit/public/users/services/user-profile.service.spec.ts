/**
 * @file user-profile.service.spec.ts
 * @description Unit tests for UserProfileService - User profile management and updates
 * @module test/unit/public/users/services
 * @category Unit Tests
 * @subcategory Public - User Profile Management
 *
 * @requires @nestjs/testing
 * @requires jest
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-14
 *
 * @see {@link ../../../../../src/public/users/services/user-profile.service.ts} for implementation
 *
 * @coverage
 * - Lines: 95%
 * - Statements: 95%
 * - Functions: 100%
 * - Branches: 92%
 *
 * @testScenarios
 * - Get current user profile
 * - Get current user with exchange rates
 * - Get current user with version check
 * - Update profile fields
 * - Update address
 * - Validate field formats
 * - Handle user not found
 * - Handle identity not found
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserProfileService } from '../../../../../src/public/users/services/user-profile.service';
import { UserModel } from '../../../../../src/public/users/models/user.model';
import { IdentityModel } from '../../../../../src/public/users/models/identity.model';
import { ExchangeRatesService } from '../../../../../src/shared/exchange/exchange-rates.service';
import { SystemVersionService } from '../../../../../src/shared/helpers/system-version.service';
import { LoggerService } from '../../../../../src/shared/logger/logger.service';
import { UserMapper } from '../../../../../src/public/users/mappers/user.mapper';
import { createLoggerServiceMock } from '../../../../utils';

/**
 * Mock user data with relations
 */
const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  phone: '+5411999999999',
  firstName: 'John',
  lastName: 'Doe',
  name: 'John Doe',
  status: 'enable',
  access: 'customer',
  language: 'es',
  country: 'ar',
  birthdate: new Date('1990-01-15'),
  gender: 'male',
  maritalStatus: 'single',
  pep: false,
  pepSince: null,
  fatherName: null,
  motherName: null,
  emailVerifiedAt: new Date(),
  phoneVerifiedAt: new Date(),
  livenessVerifiedAt: new Date(),
  onboardingState: { completedSteps: ['1.1', '1.2'], needsCorrection: [] },
  notes: null,
  verifyToken: null,
  image: null,
  livenessImage: null,
  validaId: null,
  password: 'hashedPassword',
  passwordUpdatedAt: null,
  accessToken: null,
  unlockToken: null,
  recovery: null,
  number: '1000001',
  defaultUserIdentityId: 'identity-1',
  defaultUserAccountId: 'account-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  usersIdentities: [
    {
      id: 'identity-1',
      country: 'ar',
      status: 'enable',
      type: 'individual',
      subtype: null,
      name: 'John Doe',
      taxDocumentType: 'CUIT',
      taxDocumentNumber: '20123456789',
      identityDocumentType: 'DNI',
      identityDocumentNumber: '12345678',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  usersAccounts: [
    {
      id: 'account-1',
      number: '123456789',
      type: 'ars',
      status: 'enable',
      cvu: '0000012345678901234567',
      alias: 'mi.cuenta.ars',
      balance: '10000.00',
      createdAt: new Date(),
    },
  ],
  ...overrides,
});

/**
 * @testSuite UserProfileService
 * @description Tests for user profile management operations
 */
describe('UserProfileService', () => {
  let service: UserProfileService;
  let userModel: jest.Mocked<UserModel>;
  let identityModel: jest.Mocked<IdentityModel>;
  let exchangeRatesService: jest.Mocked<ExchangeRatesService>;
  let systemVersionService: jest.Mocked<SystemVersionService>;
  let logger: jest.Mocked<LoggerService>;
  let userMapper: jest.Mocked<UserMapper>;

  /**
   * @setup
   * @description Initialize service with mocked dependencies
   */
  beforeEach(async () => {
    logger = createLoggerServiceMock();

    userModel = {
      findById: jest.fn(),
      findByIdWithValidStatus: jest.fn(),
      findByIdWithIdentities: jest.fn(),
      updateProfile: jest.fn(),
    } as any;

    identityModel = {
      updateAddress: jest.fn(),
    } as any;

    exchangeRatesService = {
      getRates: jest.fn(),
    } as any;

    systemVersionService = {
      validateVersion: jest.fn(),
    } as any;

    userMapper = {
      toProfileResponseDto: jest.fn(),
      toProfileUpdateResponseDto: jest.fn(),
      toAddressUpdateResponseDto: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileService,
        { provide: UserModel, useValue: userModel },
        { provide: IdentityModel, useValue: identityModel },
        { provide: ExchangeRatesService, useValue: exchangeRatesService },
        { provide: SystemVersionService, useValue: systemVersionService },
        { provide: LoggerService, useValue: logger },
        { provide: UserMapper, useValue: userMapper },
      ],
    }).compile();

    service = module.get<UserProfileService>(UserProfileService);
  });

  /**
   * @testGroup instantiation
   * @description Tests for service initialization
   */
  describe('instantiation', () => {
    /**
     * @test Should initialize service
     */
    it('should be defined', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(UserProfileService);
    });
  });

  /**
   * @testGroup getCurrentUser
   * @description Tests for retrieving current user profile
   */
  describe('getCurrentUser', () => {
    const userId = 'user-123';
    const mockUser = createMockUser();

    /**
     * @test Should retrieve user profile successfully
     */
    it('should get current user profile', async () => {
      const expectedResponse = {
        user: { id: userId, email: 'test@example.com' },
        forceUpgrade: false,
      };

      userModel.findById.mockResolvedValue(mockUser as any);
      userMapper.toProfileResponseDto.mockReturnValue(expectedResponse as any);

      const result = await service.getCurrentUser(userId);

      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(userMapper.toProfileResponseDto).toHaveBeenCalledWith(mockUser, {
        exchangeRates: null,
        forceUpgrade: false,
      });
      expect(result).toEqual(expectedResponse);
      expect(logger.info).toHaveBeenCalledWith('[PROFILE] Getting current user', {
        userId,
        includeRates: undefined,
      });
    });

    /**
     * @test Should include exchange rates when requested
     */
    it('should include exchange rates when includeRates is true', async () => {
      const mockRates = { btc: { buy: 50000, sell: 49000 } };
      const expectedResponse = {
        user: { id: userId },
        forceUpgrade: false,
        exchangeRates: mockRates,
      };

      userModel.findById.mockResolvedValue(mockUser as any);
      exchangeRatesService.getRates.mockResolvedValue(mockRates as any);
      userMapper.toProfileResponseDto.mockReturnValue(expectedResponse as any);

      const result = await service.getCurrentUser(userId, undefined, true);

      expect(exchangeRatesService.getRates).toHaveBeenCalled();
      expect(userMapper.toProfileResponseDto).toHaveBeenCalledWith(mockUser, {
        exchangeRates: mockRates,
        forceUpgrade: false,
      });
      expect(result).toEqual(expectedResponse);
    });

    /**
     * @test Should handle exchange rates failure gracefully
     */
    it('should handle exchange rates failure and return null rates', async () => {
      const expectedResponse = {
        user: { id: userId },
        forceUpgrade: false,
      };

      userModel.findById.mockResolvedValue(mockUser as any);
      exchangeRatesService.getRates.mockRejectedValue(new Error('Manteca API error'));
      userMapper.toProfileResponseDto.mockReturnValue(expectedResponse as any);

      await service.getCurrentUser(userId, undefined, true);

      expect(exchangeRatesService.getRates).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        '[PROFILE] Manteca getRates failed (non-critical)',
        { error: 'Manteca API error' },
      );
      expect(userMapper.toProfileResponseDto).toHaveBeenCalledWith(mockUser as any, {
        exchangeRates: null,
        forceUpgrade: false,
      });
    });

    /**
     * @test Should set forceUpgrade when version is invalid
     */
    it('should set forceUpgrade to true when version is invalid', async () => {
      const systemVersion = '1.0.0';
      const expectedResponse = {
        user: { id: userId },
        forceUpgrade: true,
      };

      userModel.findById.mockResolvedValue(mockUser as any);
      systemVersionService.validateVersion.mockReturnValue({ isValid: false } as any);
      userMapper.toProfileResponseDto.mockReturnValue(expectedResponse as any);

      await service.getCurrentUser(userId, systemVersion);

      expect(systemVersionService.validateVersion).toHaveBeenCalledWith(systemVersion);
      expect(userMapper.toProfileResponseDto).toHaveBeenCalledWith(mockUser as any, {
        exchangeRates: null,
        forceUpgrade: true,
      });
    });

    /**
     * @test Should set forceUpgrade to false when version is valid
     */
    it('should set forceUpgrade to false when version is valid', async () => {
      const systemVersion = '2.0.0';
      const expectedResponse = {
        user: { id: userId },
        forceUpgrade: false,
      };

      userModel.findById.mockResolvedValue(mockUser as any);
      systemVersionService.validateVersion.mockReturnValue({ isValid: true } as any);
      userMapper.toProfileResponseDto.mockReturnValue(expectedResponse as any);

      await service.getCurrentUser(userId, systemVersion);

      expect(systemVersionService.validateVersion).toHaveBeenCalledWith(systemVersion);
      expect(userMapper.toProfileResponseDto).toHaveBeenCalledWith(mockUser as any, {
        exchangeRates: null,
        forceUpgrade: false,
      });
    });

    /**
     * @test Should not validate version when not provided
     */
    it('should not validate version when systemVersion is not provided', async () => {
      userModel.findById.mockResolvedValue(mockUser as any);
      userMapper.toProfileResponseDto.mockReturnValue({ user: {}, forceUpgrade: false } as any);

      await service.getCurrentUser(userId);

      expect(systemVersionService.validateVersion).not.toHaveBeenCalled();
    });

    /**
     * @test Should handle user not found
     */
    it('should throw NotFoundException when user is not found', async () => {
      userModel.findById.mockRejectedValue(
        new NotFoundException('users.errors.userNotFound'),
      );

      await expect(service.getCurrentUser(userId)).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * @testGroup updateProfile
   * @description Tests for updating user profile
   */
  describe('updateProfile', () => {
    const userId = 'user-123';
    const mockUser = createMockUser();
    const mockUpdatedUser = { ...mockUser, firstName: 'Jane', lastName: 'Smith' };

    /**
     * @test Should update profile with valid first name
     */
    it('should update firstName successfully', async () => {
      const dto = { firstName: 'jane' };
      const expectedResponse = { success: true, user: { firstName: 'Jane' } };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);
      userModel.updateProfile.mockResolvedValue(mockUpdatedUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue(expectedResponse as any);

      const result = await service.updateProfile(userId, dto);

      expect(userModel.findByIdWithValidStatus).toHaveBeenCalledWith(userId);
      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        firstName: 'Jane',
        name: 'jane Doe',
        updatedAt: expect.any(Date),
      }));
      expect(result).toEqual(expectedResponse);
    });

    /**
     * @test Should update profile with valid last name
     */
    it('should update lastName successfully', async () => {
      const dto = { lastName: 'SMITH' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);
      userModel.updateProfile.mockResolvedValue(mockUpdatedUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateProfile(userId, dto);

      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        lastName: 'Smith',
        name: 'John SMITH',
        updatedAt: expect.any(Date),
      }));
    });

    /**
     * @test Should update both first and last name
     */
    it('should update both firstName and lastName', async () => {
      const dto = { firstName: 'jane', lastName: 'smith' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);
      userModel.updateProfile.mockResolvedValue(mockUpdatedUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateProfile(userId, dto);

      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        firstName: 'Jane',
        lastName: 'Smith',
        name: 'jane smith',
        updatedAt: expect.any(Date),
      }));
    });

    /**
     * @test Should reject invalid first name (too short)
     */
    it('should throw error for firstName that is too short', async () => {
      const dto = { firstName: 'J' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);

      await expect(service.updateProfile(userId, dto)).rejects.toThrow(
        'users.errors.invalidFirstName',
      );
    });

    /**
     * @test Should reject empty first name
     */
    it('should throw error for empty firstName', async () => {
      const dto = { firstName: '  ' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);

      await expect(service.updateProfile(userId, dto)).rejects.toThrow(
        'users.errors.invalidFirstName',
      );
    });

    /**
     * @test Should reject invalid last name (too short)
     */
    it('should throw error for lastName that is too short', async () => {
      const dto = { lastName: 'D' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);

      await expect(service.updateProfile(userId, dto)).rejects.toThrow(
        'users.errors.invalidLastName',
      );
    });

    /**
     * @test Should update valid phone number
     */
    it('should update phone with valid format', async () => {
      const dto = { phone: '+5411999888777' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);
      userModel.updateProfile.mockResolvedValue(mockUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateProfile(userId, dto);

      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        phone: '+5411999888777',
      }));
    });

    /**
     * @test Should reject invalid phone number
     */
    it('should throw error for invalid phone format', async () => {
      const dto = { phone: 'not-a-phone' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);

      await expect(service.updateProfile(userId, dto)).rejects.toThrow(
        'users.errors.invalidPhone',
      );
    });

    /**
     * @test Should update language
     */
    it('should update language', async () => {
      const dto = { language: 'en' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);
      userModel.updateProfile.mockResolvedValue(mockUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateProfile(userId, dto);

      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        language: 'en',
      }));
    });

    /**
     * @test Should update valid country
     */
    it('should update country with valid value (ar)', async () => {
      const dto = { country: 'ar' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);
      userModel.updateProfile.mockResolvedValue(mockUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateProfile(userId, dto);

      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        country: 'ar',
      }));
    });

    /**
     * @test Should update valid country (br)
     */
    it('should update country with valid value (br)', async () => {
      const dto = { country: 'br' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);
      userModel.updateProfile.mockResolvedValue(mockUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateProfile(userId, dto);

      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        country: 'br',
      }));
    });

    /**
     * @test Should reject invalid country
     */
    it('should throw error for invalid country', async () => {
      const dto = { country: 'us' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);

      await expect(service.updateProfile(userId, dto)).rejects.toThrow(
        'users.errors.invalidCountry',
      );
    });

    /**
     * @test Should update valid birthdate
     */
    it('should update birthdate with valid format', async () => {
      const dto = { birthdate: '1990-05-15' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);
      userModel.updateProfile.mockResolvedValue(mockUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateProfile(userId, dto);

      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        birthdate: expect.any(Date),
      }));
    });

    /**
     * @test Should reject invalid birthdate format
     */
    it('should throw error for invalid birthdate format', async () => {
      const dto = { birthdate: '15-05-1990' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);

      await expect(service.updateProfile(userId, dto)).rejects.toThrow(
        'users.errors.invalidBirthdate',
      );
    });

    /**
     * @test Should reject invalid birthdate format (with slashes)
     */
    it('should throw error for birthdate with slashes', async () => {
      const dto = { birthdate: '1990/05/15' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);

      await expect(service.updateProfile(userId, dto)).rejects.toThrow(
        'users.errors.invalidBirthdate',
      );
    });

    /**
     * @test Should update valid gender (male)
     */
    it('should update gender with valid value (male)', async () => {
      const dto = { gender: 'male' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);
      userModel.updateProfile.mockResolvedValue(mockUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateProfile(userId, dto);

      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        gender: 'male',
      }));
    });

    /**
     * @test Should update valid gender (female)
     */
    it('should update gender with valid value (female)', async () => {
      const dto = { gender: 'female' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);
      userModel.updateProfile.mockResolvedValue(mockUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateProfile(userId, dto);

      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        gender: 'female',
      }));
    });

    /**
     * @test Should reject invalid gender
     */
    it('should throw error for invalid gender', async () => {
      const dto = { gender: 'other' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);

      await expect(service.updateProfile(userId, dto)).rejects.toThrow(
        'users.errors.invalidGender',
      );
    });

    /**
     * @test Should update valid marital status
     */
    it('should update maritalStatus with valid value', async () => {
      const validStatuses = ['single', 'married', 'divorced', 'widowed', 'cohabiting', 'separated'];

      for (const status of validStatuses) {
        const dto = { maritalStatus: status };

        userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);
        userModel.updateProfile.mockResolvedValue(mockUser as any);
        userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

        await service.updateProfile(userId, dto);

        expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
          maritalStatus: status,
        }));
      }
    });

    /**
     * @test Should reject invalid marital status
     */
    it('should throw error for invalid maritalStatus', async () => {
      const dto = { maritalStatus: 'engaged' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);

      await expect(service.updateProfile(userId, dto)).rejects.toThrow(
        'users.errors.invalidMaritalStatus',
      );
    });

    /**
     * @test Should update profile picture URL
     */
    it('should update profilePicture.url', async () => {
      const dto = { profilePicture: { url: 'https://example.com/profile.jpg' } };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);
      userModel.updateProfile.mockResolvedValue(mockUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateProfile(userId, dto);

      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        image: 'https://example.com/profile.jpg',
      }));
    });

    /**
     * @test Should handle user not found
     */
    it('should throw NotFoundException when user not found', async () => {
      userModel.findByIdWithValidStatus.mockRejectedValue(
        new NotFoundException('users.errors.userNotFound'),
      );

      await expect(service.updateProfile(userId, { firstName: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    /**
     * @test Should handle user lastName missing when updating firstName only
     */
    it('should update name with existing lastName when only firstName provided', async () => {
      const dto = { firstName: 'Jane' };
      const userWithLastName = { ...mockUser, lastName: 'Smith' };

      userModel.findByIdWithValidStatus.mockResolvedValue(userWithLastName as any);
      userModel.updateProfile.mockResolvedValue(mockUpdatedUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateProfile(userId, dto);

      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        name: 'Jane Smith',
      }));
    });

    /**
     * @test Should update name with existing firstName when only lastName provided
     */
    it('should update name with existing firstName when only lastName provided', async () => {
      const dto = { lastName: 'Wilson' };
      const userWithFirstName = { ...mockUser, firstName: 'John' };

      userModel.findByIdWithValidStatus.mockResolvedValue(userWithFirstName as any);
      userModel.updateProfile.mockResolvedValue(mockUpdatedUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateProfile(userId, dto);

      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        name: 'John Wilson',
      }));
    });
  });

  /**
   * @testGroup updateAddress
   * @description Tests for updating user address
   */
  describe('updateAddress', () => {
    const userId = 'user-123';
    const validAddressDto = {
      zipCode: '01310100',
      street: 'Avenida Paulista',
      number: '1000',
      city: 'São Paulo',
      state: 'SP',
      neighborhood: 'Bela Vista',
      complement: 'Sala 101',
    };

    const mockUser = createMockUser({
      defaultUserIdentityId: 'identity-1',
      usersIdentities_usersIdentities_userIdTousers: [
        { id: 'identity-1', createdAt: new Date(), status: 'enable' },
      ],
    });

    /**
     * @test Should update address successfully
     */
    it('should update address with all fields', async () => {
      const expectedAddressPayload = {
        zipCode: '01310100',
        street: 'Avenida Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        complement: 'Sala 101',
      };

      userModel.findByIdWithIdentities.mockResolvedValue(mockUser as any);
      identityModel.updateAddress.mockResolvedValue({} as any);
      userMapper.toAddressUpdateResponseDto.mockReturnValue({
        success: true,
        address: expectedAddressPayload,
      } as any);

      const result = await service.updateAddress(userId, validAddressDto);

      expect(userModel.findByIdWithIdentities).toHaveBeenCalledWith(userId);
      expect(identityModel.updateAddress).toHaveBeenCalledWith(
        'identity-1',
        JSON.stringify(expectedAddressPayload),
      );
      expect(result.success).toBe(true);
    });

    /**
     * @test Should update address without optional fields
     */
    it('should update address without neighborhood and complement', async () => {
      const minimalAddressDto = {
        zipCode: '01310100',
        street: 'Avenida Paulista',
        number: '1000',
        city: 'São Paulo',
        state: 'SP',
      };

      userModel.findByIdWithIdentities.mockResolvedValue(mockUser as any);
      identityModel.updateAddress.mockResolvedValue({} as any);
      userMapper.toAddressUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateAddress(userId, minimalAddressDto);

      expect(identityModel.updateAddress).toHaveBeenCalledWith(
        'identity-1',
        expect.stringContaining('"neighborhood":null'),
      );
    });

    /**
     * @test Should throw error when zipCode is missing
     */
    it('should throw error when zipCode is missing', async () => {
      const invalidDto = {
        street: 'Avenida Paulista',
        number: '1000',
        city: 'São Paulo',
        state: 'SP',
      };

      await expect(service.updateAddress(userId, invalidDto as any)).rejects.toThrow(
        'users.errors.invalidAddress',
      );
    });

    /**
     * @test Should throw error when street is missing
     */
    it('should throw error when street is missing', async () => {
      const invalidDto = {
        zipCode: '01310100',
        number: '1000',
        city: 'São Paulo',
        state: 'SP',
      };

      await expect(service.updateAddress(userId, invalidDto as any)).rejects.toThrow(
        'users.errors.invalidAddress',
      );
    });

    /**
     * @test Should throw error when number is missing
     */
    it('should throw error when number is missing', async () => {
      const invalidDto = {
        zipCode: '01310100',
        street: 'Avenida Paulista',
        city: 'São Paulo',
        state: 'SP',
      };

      await expect(service.updateAddress(userId, invalidDto as any)).rejects.toThrow(
        'users.errors.invalidAddress',
      );
    });

    /**
     * @test Should throw error when city is missing
     */
    it('should throw error when city is missing', async () => {
      const invalidDto = {
        zipCode: '01310100',
        street: 'Avenida Paulista',
        number: '1000',
        state: 'SP',
      };

      await expect(service.updateAddress(userId, invalidDto as any)).rejects.toThrow(
        'users.errors.invalidAddress',
      );
    });

    /**
     * @test Should throw error when state is missing
     */
    it('should throw error when state is missing', async () => {
      const invalidDto = {
        zipCode: '01310100',
        street: 'Avenida Paulista',
        number: '1000',
        city: 'São Paulo',
      };

      await expect(service.updateAddress(userId, invalidDto as any)).rejects.toThrow(
        'users.errors.invalidAddress',
      );
    });

    /**
     * @test Should throw error when zipCode is empty
     */
    it('should throw error when zipCode is empty string', async () => {
      const invalidDto = {
        ...validAddressDto,
        zipCode: '  ',
      };

      await expect(service.updateAddress(userId, invalidDto)).rejects.toThrow(
        'users.errors.invalidAddress',
      );
    });

    /**
     * @test Should use most recent identity when no default identity
     */
    it('should use most recent identity when defaultUserIdentityId is null', async () => {
      const userWithoutDefault = {
        ...mockUser,
        defaultUserIdentityId: null,
        usersIdentities_usersIdentities_userIdTousers: [
          { id: 'identity-old', createdAt: new Date('2024-01-01'), status: 'enable' },
          { id: 'identity-new', createdAt: new Date('2025-01-01'), status: 'enable' },
        ],
      };

      userModel.findByIdWithIdentities.mockResolvedValue(userWithoutDefault as any);
      identityModel.updateAddress.mockResolvedValue({} as any);
      userMapper.toAddressUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateAddress(userId, validAddressDto);

      expect(identityModel.updateAddress).toHaveBeenCalledWith(
        'identity-new',
        expect.any(String),
      );
    });

    /**
     * @test Should throw error when no identity found
     */
    it('should throw error when user has no identities', async () => {
      const userWithNoIdentities = {
        ...mockUser,
        defaultUserIdentityId: null,
        usersIdentities_usersIdentities_userIdTousers: [],
      };

      userModel.findByIdWithIdentities.mockResolvedValue(userWithNoIdentities as any);

      await expect(service.updateAddress(userId, validAddressDto)).rejects.toThrow(
        'users.errors.identityNotFound',
      );
    });

    /**
     * @test Should throw NotFoundException when user not found
     */
    it('should throw NotFoundException when user not found', async () => {
      userModel.findByIdWithIdentities.mockRejectedValue(
        new NotFoundException('users.errors.userNotFound'),
      );

      await expect(service.updateAddress(userId, validAddressDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * @testGroup formatName (private method via updateProfile)
   * @description Tests for name formatting
   */
  describe('formatName (via updateProfile)', () => {
    const userId = 'user-123';
    const mockUser = createMockUser();

    /**
     * @test Should capitalize first letter of each word
     */
    it('should capitalize first letter of each word', async () => {
      const dto = { firstName: 'john doe' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);
      userModel.updateProfile.mockResolvedValue(mockUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateProfile(userId, dto);

      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        firstName: 'John Doe',
      }));
    });

    /**
     * @test Should handle all uppercase input
     */
    it('should handle all uppercase input', async () => {
      const dto = { firstName: 'JOHN' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);
      userModel.updateProfile.mockResolvedValue(mockUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateProfile(userId, dto);

      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        firstName: 'John',
      }));
    });

    /**
     * @test Should trim whitespace
     */
    it('should trim leading and trailing whitespace', async () => {
      const dto = { firstName: '  john  ' };

      userModel.findByIdWithValidStatus.mockResolvedValue(mockUser as any);
      userModel.updateProfile.mockResolvedValue(mockUser as any);
      userMapper.toProfileUpdateResponseDto.mockReturnValue({ success: true } as any);

      await service.updateProfile(userId, dto);

      expect(userModel.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        firstName: 'John',
      }));
    });
  });
});
