import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EmailValidationService } from '../../../../../src/public/auth/services/email-validation.service';
import { AuthUserModel } from '../../../../../src/public/auth/models/user.model';
import { EmailService } from '../../../../../src/shared/email/email.service';
import { AuthMapper } from '../../../../../src/public/auth/mappers/auth.mapper';

describe('EmailValidationService', () => {
  let service: EmailValidationService;
  let userModel: jest.Mocked<AuthUserModel>;
  let emailService: jest.Mocked<EmailService>;
  let authMapper: jest.Mocked<AuthMapper>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    phone: '+5511999999999',
    firstName: 'John',
    lastName: 'Doe',
    status: 'active',
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

    emailService = {
      sendValidationCode: jest.fn(),
      verifyCode: jest.fn(),
      normalizeEmail: jest.fn((email) => email.toLowerCase().trim()),
      validateCode: jest.fn(),
      isMockCode: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;

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
        EmailValidationService,
        { provide: AuthUserModel, useValue: userModel },
        { provide: EmailService, useValue: emailService },
        { provide: AuthMapper, useValue: authMapper },
      ],
    }).compile();

    service = module.get<EmailValidationService>(EmailValidationService);
  });

  describe('sendEmailValidation', () => {
    const sendEmailDto = { email: 'test@example.com' };

    it('should send email validation code successfully', async () => {
      const emailServiceResult = {
        success: true,
        message: 'Validation code sent to email',
        email: 'test@example.com',
        expiresIn: 300,
      };
      const mapperResult = { message: 'Validation code sent to email' };

      emailService.sendValidationCode.mockResolvedValue(emailServiceResult);
      authMapper.toEmailValidationResponseDto.mockReturnValue(mapperResult);

      const result = await service.sendEmailValidation(sendEmailDto);

      expect(emailService.sendValidationCode).toHaveBeenCalledWith(
        'test@example.com',
        8,
        5,
        true,
      );
      expect(authMapper.toEmailValidationResponseDto).toHaveBeenCalledWith(
        emailServiceResult.message,
      );
      expect(result).toEqual(mapperResult);
    });

    it('should send email validation with uppercase email', async () => {
      const dtoWithUppercase = { email: 'TEST@EXAMPLE.COM' };
      const emailServiceResult = {
        success: true,
        message: 'Validation code sent to email',
        email: 'test@example.com',
        expiresIn: 300,
      };
      const mapperResult = { message: 'Validation code sent to email' };

      emailService.sendValidationCode.mockResolvedValue(emailServiceResult);
      authMapper.toEmailValidationResponseDto.mockReturnValue(mapperResult);

      const result = await service.sendEmailValidation(dtoWithUppercase);

      expect(emailService.sendValidationCode).toHaveBeenCalledWith(
        'TEST@EXAMPLE.COM',
        8,
        5,
        true,
      );
      expect(result).toEqual(mapperResult);
    });

    it('should send email validation with spaces in email', async () => {
      const dtoWithSpaces = { email: '  test@example.com  ' };
      const emailServiceResult = {
        success: true,
        message: 'Validation code sent to email',
        email: 'test@example.com',
        expiresIn: 300,
      };
      const mapperResult = { message: 'Validation code sent to email' };

      emailService.sendValidationCode.mockResolvedValue(emailServiceResult);
      authMapper.toEmailValidationResponseDto.mockReturnValue(mapperResult);

      const result = await service.sendEmailValidation(dtoWithSpaces);

      expect(emailService.sendValidationCode).toHaveBeenCalledWith(
        '  test@example.com  ',
        8,
        5,
        true,
      );
      expect(result).toEqual(mapperResult);
    });

    it('should handle email service failure', async () => {
      emailService.sendValidationCode.mockRejectedValue(
        new Error('Email service down'),
      );

      await expect(service.sendEmailValidation(sendEmailDto)).rejects.toThrow(
        'Email service down',
      );
    });

    it('should handle network timeout error', async () => {
      emailService.sendValidationCode.mockRejectedValue(
        new Error('Network timeout'),
      );

      await expect(service.sendEmailValidation(sendEmailDto)).rejects.toThrow(
        'Network timeout',
      );
    });

    it('should handle rate limit error from email service', async () => {
      emailService.sendValidationCode.mockRejectedValue(
        new Error('Rate limit exceeded'),
      );

      await expect(service.sendEmailValidation(sendEmailDto)).rejects.toThrow(
        'Rate limit exceeded',
      );
    });
  });

  describe('verifyEmailCode', () => {
    const verifyEmailDto = { email: 'test@example.com', code: '12345678' };

    it('should verify email code successfully for existing user', async () => {
      const emailServiceResult = {
        success: true,
        message: 'Email verified successfully',
        email: 'test@example.com',
      };
      const mapperResult = {
        message: 'Email verified successfully',
        email: 'test@example.com',
        nextStep: 'password',
      };

      emailService.verifyCode.mockResolvedValue(emailServiceResult);
      emailService.normalizeEmail.mockReturnValue('test@example.com');
      userModel.findByEmail.mockResolvedValue(mockUser as any);
      userModel.updateEmailVerified.mockResolvedValue({
        ...mockUser,
        emailVerifiedAt: new Date(),
      } as any);
      authMapper.toEmailCodeVerificationResponseDto.mockReturnValue(
        mapperResult,
      );

      const result = await service.verifyEmailCode(verifyEmailDto);

      expect(emailService.verifyCode).toHaveBeenCalledWith(
        'test@example.com',
        '12345678',
        true,
      );
      expect(emailService.normalizeEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(userModel.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userModel.updateEmailVerified).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(
        authMapper.toEmailCodeVerificationResponseDto,
      ).toHaveBeenCalledWith(
        emailServiceResult.message,
        emailServiceResult.email,
      );
      expect(result).toEqual(mapperResult);
    });

    it('should verify email code successfully for non-existing user', async () => {
      const emailServiceResult = {
        success: true,
        message: 'Email verified successfully',
        email: 'newuser@example.com',
      };
      const verifyNewUserDto = {
        email: 'newuser@example.com',
        code: '12345678',
      };
      const mapperResult = {
        message: 'Email verified successfully',
        email: 'newuser@example.com',
        nextStep: 'password',
      };

      emailService.verifyCode.mockResolvedValue(emailServiceResult);
      emailService.normalizeEmail.mockReturnValue('newuser@example.com');
      userModel.findByEmail.mockResolvedValue(null);
      authMapper.toEmailCodeVerificationResponseDto.mockReturnValue(
        mapperResult,
      );

      const result = await service.verifyEmailCode(verifyNewUserDto);

      expect(emailService.verifyCode).toHaveBeenCalledWith(
        'newuser@example.com',
        '12345678',
        true,
      );
      expect(userModel.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(userModel.updateEmailVerified).not.toHaveBeenCalled();
      expect(result).toEqual(mapperResult);
    });

    it('should throw BadRequestException when code is expired', async () => {
      emailService.verifyCode.mockRejectedValue(
        new Error('Code not found or expired'),
      );

      await expect(service.verifyEmailCode(verifyEmailDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmailCode(verifyEmailDto)).rejects.toThrow(
        'Code not found or expired',
      );
    });

    it('should throw BadRequestException when code is invalid', async () => {
      emailService.verifyCode.mockRejectedValue(new Error('Invalid code'));

      await expect(service.verifyEmailCode(verifyEmailDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmailCode(verifyEmailDto)).rejects.toThrow(
        'Invalid code',
      );
    });

    it('should re-throw non-Error exceptions', async () => {
      const customError = { code: 'CUSTOM_ERROR', message: 'Something wrong' };
      emailService.verifyCode.mockRejectedValue(customError);

      await expect(service.verifyEmailCode(verifyEmailDto)).rejects.toEqual(
        customError,
      );
    });

    it('should normalize email before looking up user', async () => {
      const dtoWithUppercase = { email: 'TEST@EXAMPLE.COM', code: '12345678' };
      const emailServiceResult = {
        success: true,
        message: 'Email verified successfully',
        email: 'test@example.com',
      };
      const mapperResult = {
        message: 'Email verified successfully',
        email: 'test@example.com',
        nextStep: 'password',
      };

      emailService.verifyCode.mockResolvedValue(emailServiceResult);
      emailService.normalizeEmail.mockReturnValue('test@example.com');
      userModel.findByEmail.mockResolvedValue(mockUser as any);
      userModel.updateEmailVerified.mockResolvedValue({
        ...mockUser,
        emailVerifiedAt: new Date(),
      } as any);
      authMapper.toEmailCodeVerificationResponseDto.mockReturnValue(
        mapperResult,
      );

      await service.verifyEmailCode(dtoWithUppercase);

      expect(emailService.normalizeEmail).toHaveBeenCalledWith(
        'TEST@EXAMPLE.COM',
      );
      expect(userModel.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle database error when finding user', async () => {
      const emailServiceResult = {
        success: true,
        message: 'Email verified successfully',
        email: 'test@example.com',
      };

      emailService.verifyCode.mockResolvedValue(emailServiceResult);
      emailService.normalizeEmail.mockReturnValue('test@example.com');
      userModel.findByEmail.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.verifyEmailCode(verifyEmailDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle database error when updating email verified', async () => {
      const emailServiceResult = {
        success: true,
        message: 'Email verified successfully',
        email: 'test@example.com',
      };

      emailService.verifyCode.mockResolvedValue(emailServiceResult);
      emailService.normalizeEmail.mockReturnValue('test@example.com');
      userModel.findByEmail.mockResolvedValue(mockUser as any);
      userModel.updateEmailVerified.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(service.verifyEmailCode(verifyEmailDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty email in sendEmailValidation', async () => {
      const emptyEmailDto = { email: '' };
      const emailServiceResult = {
        success: true,
        message: 'Validation code sent to email',
        email: '',
        expiresIn: 300,
      };
      const mapperResult = { message: 'Validation code sent to email' };

      emailService.sendValidationCode.mockResolvedValue(emailServiceResult);
      authMapper.toEmailValidationResponseDto.mockReturnValue(mapperResult);

      const result = await service.sendEmailValidation(emptyEmailDto);

      expect(emailService.sendValidationCode).toHaveBeenCalledWith(
        '',
        8,
        5,
        true,
      );
      expect(result).toEqual(mapperResult);
    });

    it('should handle special characters in email', async () => {
      const specialEmailDto = { email: 'test+special@example.com' };
      const emailServiceResult = {
        success: true,
        message: 'Validation code sent to email',
        email: 'test+special@example.com',
        expiresIn: 300,
      };
      const mapperResult = { message: 'Validation code sent to email' };

      emailService.sendValidationCode.mockResolvedValue(emailServiceResult);
      authMapper.toEmailValidationResponseDto.mockReturnValue(mapperResult);

      const result = await service.sendEmailValidation(specialEmailDto);

      expect(emailService.sendValidationCode).toHaveBeenCalledWith(
        'test+special@example.com',
        8,
        5,
        true,
      );
      expect(result).toEqual(mapperResult);
    });

    it('should handle very long verification code', async () => {
      const longCodeDto = {
        email: 'test@example.com',
        code: '123456789012345678901234567890',
      };
      emailService.verifyCode.mockRejectedValue(new Error('Invalid code'));

      await expect(service.verifyEmailCode(longCodeDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
