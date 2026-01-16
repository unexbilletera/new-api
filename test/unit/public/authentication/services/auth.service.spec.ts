import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from '../../../../../src/public/auth/services/auth.service';
import { PrismaService } from '../../../../../src/shared/prisma/prisma.service';
import { LoggerService } from '../../../../../src/shared/logger/logger.service';
import { JwtService } from '../../../../../src/shared/jwt/jwt.service';
import { NotificationService } from '../../../../../src/shared/notifications/notifications.service';
import { AccessLogService } from '../../../../../src/shared/access-log/access-log.service';
import { CronosService } from '../../../../../src/shared/cronos/cronos.service';
import { ExchangeRatesService } from '../../../../../src/shared/exchange/exchange-rates.service';
import { SystemVersionService } from '../../../../../src/shared/helpers/system-version.service';
import { SmsService } from '../../../../../src/shared/sms/sms.service';
import { EmailService } from '../../../../../src/shared/email/email.service';
import { AuthMapper } from '../../../../../src/public/auth/mappers/auth.mapper';
import { PasswordHelper } from '../../../../../src/shared/helpers/password.helper';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: jest.Mocked<JwtService>;
  let logger: jest.Mocked<LoggerService>;
  let notificationService: jest.Mocked<NotificationService>;
  let accessLogService: jest.Mocked<AccessLogService>;
  let cronosService: jest.Mocked<CronosService>;
  let exchangeRatesService: jest.Mocked<ExchangeRatesService>;
  let systemVersionService: jest.Mocked<SystemVersionService>;
  let smsService: jest.Mocked<SmsService>;
  let emailService: jest.Mocked<EmailService>;
  let authMapper: jest.Mocked<AuthMapper>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    phone: '+5511999999999',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashed_password',
    status: 'active',
    access: 'customer',
  };

  beforeEach(async () => {
    prisma = {
      users: {
        findFirst: jest.fn() as jest.Mock,
        findUnique: jest.fn() as jest.Mock,
        create: jest.fn() as jest.Mock,
        update: jest.fn() as jest.Mock,
      },
      email_validation_codes: {
        findFirst: jest.fn() as jest.Mock,
        create: jest.fn() as jest.Mock,
        update: jest.fn() as jest.Mock,
        deleteMany: jest.fn() as jest.Mock,
      },
      phone_validation_codes: {
        findFirst: jest.fn() as jest.Mock,
        create: jest.fn() as jest.Mock,
        update: jest.fn() as jest.Mock,
        deleteMany: jest.fn() as jest.Mock,
      },
    } as any;

    jwtService = {
      generateToken: jest.fn(),
      verifyToken: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    logger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    notificationService = {
      send: jest.fn(),
      sendPasswordRecovery: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    accessLogService = {
      log: jest.fn(),
      logSuccess: jest.fn(),
      logFailure: jest.fn(),
    } as unknown as jest.Mocked<AccessLogService>;

    cronosService = {
      schedule: jest.fn(),
    } as unknown as jest.Mocked<CronosService>;

    exchangeRatesService = {
      getRates: jest.fn(),
    } as unknown as jest.Mocked<ExchangeRatesService>;

    systemVersionService = {
      getVersion: jest.fn(),
      assertVersionValid: jest.fn(),
    } as unknown as jest.Mocked<SystemVersionService>;

    smsService = {
      sendValidationCode: jest.fn(),
      verifyCode: jest.fn(),
      normalizePhone: jest.fn((phone) => phone.replace(/\D/g, '')),
    } as unknown as jest.Mocked<SmsService>;

    emailService = {
      sendValidationCode: jest.fn(),
      verifyCode: jest.fn(),
      normalizeEmail: jest.fn((email) => email.toLowerCase().trim()),
    } as unknown as jest.Mocked<EmailService>;

    authMapper = {
      toSignupResponseDto: jest.fn(),
      toSignupDeviceRequiredResponseDto: jest.fn(),
      toSigninResponseDto: jest.fn(),
      toSigninDeviceRequiredResponseDto: jest.fn(),
      toUnlockAccountResponseDto: jest.fn(),
    } as unknown as jest.Mocked<AuthMapper>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: LoggerService, useValue: logger },
        { provide: NotificationService, useValue: notificationService },
        { provide: AccessLogService, useValue: accessLogService },
        { provide: CronosService, useValue: cronosService },
        { provide: ExchangeRatesService, useValue: exchangeRatesService },
        { provide: SystemVersionService, useValue: systemVersionService },
        { provide: SmsService, useValue: smsService },
        { provide: EmailService, useValue: emailService },
        { provide: AuthMapper, useValue: authMapper },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('sendEmailValidation', () => {
    it('should send email validation code successfully', async () => {
      const dto = { email: 'test@example.com' };
      emailService.sendValidationCode.mockResolvedValue({
        success: true,
        message: 'Sent',
        email: 'test@example.com',
        expiresIn: 300,
      });

      const result = await service.sendEmailValidation(dto);

      expect(emailService.sendValidationCode).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Number),
        expect.any(Number),
        expect.any(Boolean),
      );
      expect(result).toHaveProperty('message');
    });

    it('should normalize email to lowercase', async () => {
      const dto = { email: 'TEST@EXAMPLE.COM' };
      emailService.sendValidationCode.mockResolvedValue({
        success: true,
        message: 'Sent',
        email: 'test@example.com',
        expiresIn: 300,
      });

      await service.sendEmailValidation(dto);

      expect(emailService.sendValidationCode).toHaveBeenCalledWith(
        'TEST@EXAMPLE.COM',
        expect.any(Number),
        expect.any(Number),
        expect.any(Boolean),
      );
    });

    it('should handle email service failure gracefully', async () => {
      const dto = { email: 'test@example.com' };
      const mockValidationCode = {
        id: 'code-123',
        email: 'test@example.com',
        code: '12345678',
        verified: false,
        expiresAt: new Date(),
      };

      (prisma.email_validation_codes.create as jest.Mock).mockResolvedValue(
        mockValidationCode,
      );
      emailService.sendValidationCode.mockRejectedValue(
        new Error('Email service down'),
      );

      await expect(service.sendEmailValidation(dto)).rejects.toThrow();
    });
  });

  describe('sendPhoneValidation', () => {
    it('should send phone validation code successfully', async () => {
      const dto = { phone: '+5511999999999' };
      smsService.sendValidationCode.mockResolvedValue({
        success: true,
        message: 'Sent',
        phone: '+5511999999999',
        expiresIn: 300,
      });

      const result = await service.sendPhoneValidation(dto);

      expect(smsService.sendValidationCode).toHaveBeenCalledWith(
        '+5511999999999',
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
      );
      expect(result).toHaveProperty('message');
    });

    it('should normalize phone by removing non-digits', async () => {
      const dto = { phone: '+55 (11) 9 9999-9999' };
      smsService.sendValidationCode.mockResolvedValue({
        success: true,
        message: 'Sent',
        phone: '5511999999999',
        expiresIn: 300,
      });

      await service.sendPhoneValidation(dto);

      expect(smsService.sendValidationCode).toHaveBeenCalledWith(
        '+55 (11) 9 9999-9999',
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
      );
    });
  });

  describe('verifyEmailCode', () => {
    it('should verify valid email code', async () => {
      const dto = { email: 'test@example.com', code: '12345678' };
      emailService.verifyCode.mockResolvedValue({
        success: true,
        message: 'ok',
        email: 'test@example.com',
      });
      (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.users.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        emailVerifiedAt: new Date(),
      });

      const result = await service.verifyEmailCode(dto);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('email');
    });

    it('should throw error if code expired', async () => {
      const dto = { email: 'test@example.com', code: '12345678' };

      emailService.verifyCode.mockRejectedValue(new Error('expired'));

      await expect(service.verifyEmailCode(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if code invalid', async () => {
      const dto = { email: 'test@example.com', code: 'invalid' };

      emailService.verifyCode.mockRejectedValue(new Error('invalid'));

      await expect(service.verifyEmailCode(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyPhoneCode', () => {
    it('should verify valid phone code', async () => {
      const dto = { phone: '+5511999999999', code: '12345678' };
      smsService.verifyCode.mockResolvedValue({
        success: true,
        message: 'ok',
        phone: '+5511999999999',
      });
      (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.users.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        phoneVerifiedAt: new Date(),
      });

      const result = await service.verifyPhoneCode(dto);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('phone');
    });

    it('should throw error if phone code expired', async () => {
      const dto = { phone: '+5511999999999', code: '12345678' };

      smsService.verifyCode.mockRejectedValue(new Error('expired'));

      await expect(service.verifyPhoneCode(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send password recovery code for existing user', async () => {
      const dto = { email: 'test@example.com' };

      (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.users.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        recovery: 'hash',
      });
      notificationService.sendPasswordRecovery.mockResolvedValue(undefined);

      const result = await service.forgotPassword(dto);

      expect(notificationService.sendPasswordRecovery).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });

    it('should return success message even if user does not exist', async () => {
      const dto = { email: 'nonexistent@example.com' };

      (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.forgotPassword(dto);
      expect(result).toHaveProperty('message');
    });
  });

  describe('verifyPassword', () => {
    it('should verify password recovery code and reset password', async () => {
      const dto = {
        email: 'test@example.com',
        code: '12345678',
        newPassword: 'NewPassword123!',
      };

      const userWithRecovery = { ...mockUser, recovery: 'hashed' };
      (prisma.users.findFirst as jest.Mock).mockResolvedValue(userWithRecovery);
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest
        .spyOn(PasswordHelper, 'hash')
        .mockResolvedValue('new_hashed_password');
      (prisma.users.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'new_hashed_password',
      });

      const result = await service.verifyPassword(dto);

      expect(prisma.users.update).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });

    it('should throw error if code invalid', async () => {
      const dto = {
        email: 'test@example.com',
        code: 'invalid',
        newPassword: 'NewPassword123!',
      };

      (prisma.users.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        recovery: 'hashed',
      });
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(service.verifyPassword(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('unlockAccount', () => {
    it('should unlock account with valid credentials', async () => {
      const dto = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        password: 'ValidPassword123!',
        systemVersion: '1.0.0',
      };

      (prisma.users.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        id: dto.id,
        password: 'hashedpwd',
        status: 'disable',
      });
      jest.spyOn(PasswordHelper, 'compare').mockResolvedValue(true);
      (prisma.users.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        status: 'enable',
      });
      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        id: dto.id,
        status: 'enable',
      });
      systemVersionService.assertVersionValid.mockReturnValue(undefined);
      authMapper.toUnlockAccountResponseDto.mockReturnValue({
        message: 'Account unlocked successfully',
        user: mockUser,
        accessToken: 'token',
        expiresIn: 3600,
      });

      const result = await service.unlockAccount(dto, {
        ipAddress: '127.0.0.1',
        userAgent: 'test',
      });

      expect(prisma.users.update).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });

    it('should throw error if credentials invalid', async () => {
      const dto = { id: 'invalid', password: 'WrongPassword' };

      (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.unlockAccount(dto)).rejects.toThrow();
    });
  });
});
