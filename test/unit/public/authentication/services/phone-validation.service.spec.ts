import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PhoneValidationService } from '../../../../../src/public/auth/services/phone-validation.service';
import { AuthUserModel } from '../../../../../src/public/auth/models/user.model';
import { SmsService } from '../../../../../src/shared/sms/sms.service';
import { AuthMapper } from '../../../../../src/public/auth/mappers/auth.mapper';

describe('PhoneValidationService', () => {
  let service: PhoneValidationService;
  let userModel: jest.Mocked<AuthUserModel>;
  let smsService: jest.Mocked<SmsService>;
  let authMapper: jest.Mocked<AuthMapper>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    phone: '5511999999999',
    firstName: 'John',
    lastName: 'Doe',
    status: 'active',
    username: '5511999999999',
  };

  beforeEach(async () => {
    userModel = {
      findByEmail: jest.fn(),
      updateEmailVerified: jest.fn(),
      findByUsername: jest.fn(),
      findByIdWithValidStatus: jest.fn(),
      create: jest.fn(),
      exists: jest.fn(),
      updateLastLogin: jest.fn(),
      updatePhoneVerified: jest.fn(),
      storeRecoveryCode: jest.fn(),
      updatePassword: jest.fn(),
      unlockAccount: jest.fn(),
      findByIdSelect: jest.fn(),
      findWithRelations: jest.fn(),
      getUserIdentities: jest.fn(),
      getUserAccounts: jest.fn(),
      hasActiveDevice: jest.fn(),
    } as unknown as jest.Mocked<AuthUserModel>;

    smsService = {
      sendValidationCode: jest.fn(),
      verifyCode: jest.fn(),
      normalizePhone: jest.fn((phone) => phone.replace(/\D/g, '')),
      validateCode: jest.fn(),
      isMockCode: jest.fn(),
    } as unknown as jest.Mocked<SmsService>;

    authMapper = {
      toEmailValidationResponseDto: jest.fn(),
      toEmailCodeVerificationResponseDto: jest.fn(),
      toSignupResponseDto: jest.fn(),
      toSignupDeviceRequiredResponseDto: jest.fn(),
      toSigninResponseDto: jest.fn(),
      toSigninDeviceRequiredResponseDto: jest.fn(),
      toPhoneValidationResponseDto: jest.fn(),
      toPhoneCodeVerificationResponseDto: jest.fn(),
      toForgotPasswordResponseDto: jest.fn(),
      toVerifyPasswordResponseDto: jest.fn(),
      toUnlockAccountResponseDto: jest.fn(),
      toTokenResponseDto: jest.fn(),
    } as unknown as jest.Mocked<AuthMapper>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhoneValidationService,
        { provide: AuthUserModel, useValue: userModel },
        { provide: SmsService, useValue: smsService },
        { provide: AuthMapper, useValue: authMapper },
      ],
    }).compile();

    service = module.get<PhoneValidationService>(PhoneValidationService);
  });

  describe('sendPhoneValidation', () => {
    const sendPhoneDto = { phone: '+5511999999999' };

    it('should send phone validation code successfully', async () => {
      const smsServiceResult = {
        success: true,
        message: 'Validation code sent to phone',
        phone: '5511999999999',
        expiresIn: 300,
      };
      const mapperResult = { message: 'Validation code sent to phone' };

      smsService.sendValidationCode.mockResolvedValue(smsServiceResult);
      authMapper.toPhoneValidationResponseDto.mockReturnValue(mapperResult);

      const result = await service.sendPhoneValidation(sendPhoneDto);

      expect(smsService.sendValidationCode).toHaveBeenCalledWith(
        '+5511999999999',
        6,
        5,
        'sms',
      );
      expect(authMapper.toPhoneValidationResponseDto).toHaveBeenCalledWith(
        smsServiceResult.message,
      );
      expect(result).toEqual(mapperResult);
    });

    it('should send phone validation with formatted phone number', async () => {
      const dtoWithFormattedPhone = { phone: '+55 (11) 99999-9999' };
      const smsServiceResult = {
        success: true,
        message: 'Validation code sent to phone',
        phone: '5511999999999',
        expiresIn: 300,
      };
      const mapperResult = { message: 'Validation code sent to phone' };

      smsService.sendValidationCode.mockResolvedValue(smsServiceResult);
      authMapper.toPhoneValidationResponseDto.mockReturnValue(mapperResult);

      const result = await service.sendPhoneValidation(dtoWithFormattedPhone);

      expect(smsService.sendValidationCode).toHaveBeenCalledWith(
        '+55 (11) 99999-9999',
        6,
        5,
        'sms',
      );
      expect(result).toEqual(mapperResult);
    });

    it('should send phone validation without country code', async () => {
      const dtoWithoutCountryCode = { phone: '11999999999' };
      const smsServiceResult = {
        success: true,
        message: 'Validation code sent to phone',
        phone: '11999999999',
        expiresIn: 300,
      };
      const mapperResult = { message: 'Validation code sent to phone' };

      smsService.sendValidationCode.mockResolvedValue(smsServiceResult);
      authMapper.toPhoneValidationResponseDto.mockReturnValue(mapperResult);

      const result = await service.sendPhoneValidation(dtoWithoutCountryCode);

      expect(smsService.sendValidationCode).toHaveBeenCalledWith(
        '11999999999',
        6,
        5,
        'sms',
      );
      expect(result).toEqual(mapperResult);
    });

    it('should handle sms service failure', async () => {
      smsService.sendValidationCode.mockRejectedValue(
        new Error('SMS service down'),
      );

      await expect(service.sendPhoneValidation(sendPhoneDto)).rejects.toThrow(
        'SMS service down',
      );
    });

    it('should handle network timeout error', async () => {
      smsService.sendValidationCode.mockRejectedValue(
        new Error('Network timeout'),
      );

      await expect(service.sendPhoneValidation(sendPhoneDto)).rejects.toThrow(
        'Network timeout',
      );
    });

    it('should handle rate limit error from sms service', async () => {
      smsService.sendValidationCode.mockRejectedValue(
        new Error('Rate limit exceeded'),
      );

      await expect(service.sendPhoneValidation(sendPhoneDto)).rejects.toThrow(
        'Rate limit exceeded',
      );
    });

    it('should handle invalid phone number error', async () => {
      const invalidPhoneDto = { phone: 'invalid' };
      smsService.sendValidationCode.mockRejectedValue(
        new Error('Invalid phone number'),
      );

      await expect(
        service.sendPhoneValidation(invalidPhoneDto),
      ).rejects.toThrow('Invalid phone number');
    });

    it('should handle carrier unavailable error', async () => {
      smsService.sendValidationCode.mockRejectedValue(
        new Error('Carrier unavailable'),
      );

      await expect(service.sendPhoneValidation(sendPhoneDto)).rejects.toThrow(
        'Carrier unavailable',
      );
    });
  });

  describe('verifyPhoneCode', () => {
    const verifyPhoneDto = { phone: '+5511999999999', code: '123456' };

    it('should verify phone code successfully for existing user', async () => {
      const smsServiceResult = {
        success: true,
        message: 'Phone verified successfully',
        phone: '5511999999999',
      };
      const mapperResult = {
        message: 'Phone verified successfully',
        phone: '5511999999999',
        nextStep: 'password',
      };

      smsService.verifyCode.mockResolvedValue(smsServiceResult);
      smsService.normalizePhone.mockReturnValue('5511999999999');
      userModel.findByUsername.mockResolvedValue(mockUser as any);
      userModel.updatePhoneVerified.mockResolvedValue({
        ...mockUser,
        phoneVerifiedAt: new Date(),
      } as any);
      authMapper.toPhoneCodeVerificationResponseDto.mockReturnValue(
        mapperResult,
      );

      const result = await service.verifyPhoneCode(verifyPhoneDto);

      expect(smsService.verifyCode).toHaveBeenCalledWith(
        '+5511999999999',
        '123456',
        true,
      );
      expect(smsService.normalizePhone).toHaveBeenCalledWith('+5511999999999');
      expect(userModel.findByUsername).toHaveBeenCalledWith('5511999999999');
      expect(userModel.updatePhoneVerified).toHaveBeenCalledWith(
        '5511999999999',
      );
      expect(authMapper.toPhoneCodeVerificationResponseDto).toHaveBeenCalledWith(
        smsServiceResult.message,
        smsServiceResult.phone,
      );
      expect(result).toEqual(mapperResult);
    });

    it('should verify phone code successfully for non-existing user', async () => {
      const smsServiceResult = {
        success: true,
        message: 'Phone verified successfully',
        phone: '5511888888888',
      };
      const verifyNewUserDto = { phone: '+5511888888888', code: '123456' };
      const mapperResult = {
        message: 'Phone verified successfully',
        phone: '5511888888888',
        nextStep: 'password',
      };

      smsService.verifyCode.mockResolvedValue(smsServiceResult);
      smsService.normalizePhone.mockReturnValue('5511888888888');
      userModel.findByUsername.mockResolvedValue(null);
      authMapper.toPhoneCodeVerificationResponseDto.mockReturnValue(
        mapperResult,
      );

      const result = await service.verifyPhoneCode(verifyNewUserDto);

      expect(smsService.verifyCode).toHaveBeenCalledWith(
        '+5511888888888',
        '123456',
        true,
      );
      expect(userModel.findByUsername).toHaveBeenCalledWith('5511888888888');
      expect(userModel.updatePhoneVerified).not.toHaveBeenCalled();
      expect(result).toEqual(mapperResult);
    });

    it('should throw BadRequestException when code is expired', async () => {
      smsService.verifyCode.mockRejectedValue(
        new Error('Code not found or expired'),
      );

      await expect(service.verifyPhoneCode(verifyPhoneDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyPhoneCode(verifyPhoneDto)).rejects.toThrow(
        'Code not found or expired',
      );
    });

    it('should throw BadRequestException when code is invalid', async () => {
      smsService.verifyCode.mockRejectedValue(new Error('Invalid code'));

      await expect(service.verifyPhoneCode(verifyPhoneDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyPhoneCode(verifyPhoneDto)).rejects.toThrow(
        'Invalid code',
      );
    });

    it('should re-throw non-Error exceptions', async () => {
      const customError = { code: 'CUSTOM_ERROR', message: 'Something wrong' };
      smsService.verifyCode.mockRejectedValue(customError);

      await expect(service.verifyPhoneCode(verifyPhoneDto)).rejects.toEqual(
        customError,
      );
    });

    it('should normalize phone before looking up user', async () => {
      const dtoWithFormattedPhone = {
        phone: '+55 (11) 99999-9999',
        code: '123456',
      };
      const smsServiceResult = {
        success: true,
        message: 'Phone verified successfully',
        phone: '5511999999999',
      };
      const mapperResult = {
        message: 'Phone verified successfully',
        phone: '5511999999999',
        nextStep: 'password',
      };

      smsService.verifyCode.mockResolvedValue(smsServiceResult);
      smsService.normalizePhone.mockReturnValue('5511999999999');
      userModel.findByUsername.mockResolvedValue(mockUser as any);
      userModel.updatePhoneVerified.mockResolvedValue({
        ...mockUser,
        phoneVerifiedAt: new Date(),
      } as any);
      authMapper.toPhoneCodeVerificationResponseDto.mockReturnValue(
        mapperResult,
      );

      await service.verifyPhoneCode(dtoWithFormattedPhone);

      expect(smsService.normalizePhone).toHaveBeenCalledWith(
        '+55 (11) 99999-9999',
      );
      expect(userModel.findByUsername).toHaveBeenCalledWith('5511999999999');
    });

    it('should handle database error when finding user', async () => {
      const smsServiceResult = {
        success: true,
        message: 'Phone verified successfully',
        phone: '5511999999999',
      };

      smsService.verifyCode.mockResolvedValue(smsServiceResult);
      smsService.normalizePhone.mockReturnValue('5511999999999');
      userModel.findByUsername.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.verifyPhoneCode(verifyPhoneDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle database error when updating phone verified', async () => {
      const smsServiceResult = {
        success: true,
        message: 'Phone verified successfully',
        phone: '5511999999999',
      };

      smsService.verifyCode.mockResolvedValue(smsServiceResult);
      smsService.normalizePhone.mockReturnValue('5511999999999');
      userModel.findByUsername.mockResolvedValue(mockUser as any);
      userModel.updatePhoneVerified.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(service.verifyPhoneCode(verifyPhoneDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should verify code with different phone formats', async () => {
      const phoneFormats = [
        { phone: '+5511999999999', code: '123456' },
        { phone: '5511999999999', code: '123456' },
        { phone: '(11) 99999-9999', code: '123456' },
        { phone: '11 99999 9999', code: '123456' },
      ];

      const smsServiceResult = {
        success: true,
        message: 'Phone verified successfully',
        phone: '5511999999999',
      };
      const mapperResult = {
        message: 'Phone verified successfully',
        phone: '5511999999999',
        nextStep: 'password',
      };

      for (const dto of phoneFormats) {
        smsService.verifyCode.mockResolvedValue(smsServiceResult);
        smsService.normalizePhone.mockReturnValue('5511999999999');
        userModel.findByUsername.mockResolvedValue(null);
        authMapper.toPhoneCodeVerificationResponseDto.mockReturnValue(
          mapperResult,
        );

        const result = await service.verifyPhoneCode(dto);
        expect(result).toEqual(mapperResult);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty phone in sendPhoneValidation', async () => {
      const emptyPhoneDto = { phone: '' };
      const smsServiceResult = {
        success: true,
        message: 'Validation code sent to phone',
        phone: '',
        expiresIn: 300,
      };
      const mapperResult = { message: 'Validation code sent to phone' };

      smsService.sendValidationCode.mockResolvedValue(smsServiceResult);
      authMapper.toPhoneValidationResponseDto.mockReturnValue(mapperResult);

      const result = await service.sendPhoneValidation(emptyPhoneDto);

      expect(smsService.sendValidationCode).toHaveBeenCalledWith('', 6, 5, 'sms');
      expect(result).toEqual(mapperResult);
    });

    it('should handle very long verification code', async () => {
      const longCodeDto = {
        phone: '+5511999999999',
        code: '123456789012345678901234567890',
      };
      smsService.verifyCode.mockRejectedValue(new Error('Invalid code'));

      await expect(service.verifyPhoneCode(longCodeDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle phone with only special characters', async () => {
      const specialPhoneDto = { phone: '+++---()()' };
      const smsServiceResult = {
        success: true,
        message: 'Validation code sent to phone',
        phone: '',
        expiresIn: 300,
      };
      const mapperResult = { message: 'Validation code sent to phone' };

      smsService.sendValidationCode.mockResolvedValue(smsServiceResult);
      authMapper.toPhoneValidationResponseDto.mockReturnValue(mapperResult);

      const result = await service.sendPhoneValidation(specialPhoneDto);

      expect(smsService.sendValidationCode).toHaveBeenCalledWith(
        '+++---()()' ,
        6,
        5,
        'sms',
      );
      expect(result).toEqual(mapperResult);
    });

    it('should handle international phone format', async () => {
      const internationalPhoneDto = { phone: '+1 (555) 123-4567' };
      const smsServiceResult = {
        success: true,
        message: 'Validation code sent to phone',
        phone: '15551234567',
        expiresIn: 300,
      };
      const mapperResult = { message: 'Validation code sent to phone' };

      smsService.sendValidationCode.mockResolvedValue(smsServiceResult);
      authMapper.toPhoneValidationResponseDto.mockReturnValue(mapperResult);

      const result = await service.sendPhoneValidation(internationalPhoneDto);

      expect(smsService.sendValidationCode).toHaveBeenCalledWith(
        '+1 (555) 123-4567',
        6,
        5,
        'sms',
      );
      expect(result).toEqual(mapperResult);
    });

    it('should handle short verification code', async () => {
      const shortCodeDto = { phone: '+5511999999999', code: '1' };
      smsService.verifyCode.mockRejectedValue(new Error('Invalid code'));

      await expect(service.verifyPhoneCode(shortCodeDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle alphanumeric verification code', async () => {
      const alphanumericCodeDto = { phone: '+5511999999999', code: 'abc123' };
      smsService.verifyCode.mockRejectedValue(new Error('Invalid code'));

      await expect(
        service.verifyPhoneCode(alphanumericCodeDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple send validation requests', async () => {
      const phones = [
        { phone: '+5511111111111' },
        { phone: '+5522222222222' },
        { phone: '+5533333333333' },
      ];

      for (const dto of phones) {
        const smsServiceResult = {
          success: true,
          message: 'Validation code sent to phone',
          phone: dto.phone.replace(/\D/g, ''),
          expiresIn: 300,
        };
        const mapperResult = { message: 'Validation code sent to phone' };

        smsService.sendValidationCode.mockResolvedValue(smsServiceResult);
        authMapper.toPhoneValidationResponseDto.mockReturnValue(mapperResult);

        const result = await service.sendPhoneValidation(dto);
        expect(result).toEqual(mapperResult);
      }

      expect(smsService.sendValidationCode).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple verify code requests', async () => {
      const verifications = [
        { phone: '+5511111111111', code: '111111' },
        { phone: '+5522222222222', code: '222222' },
        { phone: '+5533333333333', code: '333333' },
      ];

      for (const dto of verifications) {
        const normalizedPhone = dto.phone.replace(/\D/g, '');
        const smsServiceResult = {
          success: true,
          message: 'Phone verified successfully',
          phone: normalizedPhone,
        };
        const mapperResult = {
          message: 'Phone verified successfully',
          phone: normalizedPhone,
          nextStep: 'password',
        };

        smsService.verifyCode.mockResolvedValue(smsServiceResult);
        smsService.normalizePhone.mockReturnValue(normalizedPhone);
        userModel.findByUsername.mockResolvedValue(null);
        authMapper.toPhoneCodeVerificationResponseDto.mockReturnValue(
          mapperResult,
        );

        const result = await service.verifyPhoneCode(dto);
        expect(result).toEqual(mapperResult);
      }

      expect(smsService.verifyCode).toHaveBeenCalledTimes(3);
    });
  });
});
