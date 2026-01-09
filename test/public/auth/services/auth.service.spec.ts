import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../../../src/public/auth/services/auth.service';
import { PrismaService } from '../../../../src/shared/prisma/prisma.service';
import { LoggerService } from '../../../../src/shared/logger/logger.service';
import { JwtService } from '../../../../src/shared/jwt/jwt.service';
import { NotificationService } from '../../../../src/shared/notifications/notifications.service';
import { AccessLogService } from '../../../../src/shared/access-log/access-log.service';
import { CronosService } from '../../../../src/shared/cronos/cronos.service';
import { ExchangeRatesService } from '../../../../src/shared/exchange/exchange-rates.service';
import { SystemVersionService } from '../../../../src/shared/helpers/system-version.service';
import { SmsService } from '../../../../src/shared/sms/sms.service';
import { EmailService } from '../../../../src/shared/email/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let logger: jest.Mocked<LoggerService>;
  let notificationService: jest.Mocked<NotificationService>;
  let accessLogService: jest.Mocked<AccessLogService>;
  let cronosService: jest.Mocked<CronosService>;
  let exchangeRatesService: jest.Mocked<ExchangeRatesService>;
  let systemVersionService: jest.Mocked<SystemVersionService>;
  let smsService: jest.Mocked<SmsService>;
  let emailService: jest.Mocked<EmailService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    phone: '+5511999999999',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashed_password',
    status: 'active',
  };

  beforeEach(async () => {
    prisma = {
      users: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      email_validation_codes: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      phone_validation_codes: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

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
    } as unknown as jest.Mocked<NotificationService>;

    accessLogService = {
      log: jest.fn(),
    } as unknown as jest.Mocked<AccessLogService>;

    cronosService = {
      schedule: jest.fn(),
    } as unknown as jest.Mocked<CronosService>;

    exchangeRatesService = {
      getRates: jest.fn(),
    } as unknown as jest.Mocked<ExchangeRatesService>;

    systemVersionService = {
      getVersion: jest.fn(),
    } as unknown as jest.Mocked<SystemVersionService>;

    smsService = {
      sendValidationCode: jest.fn(),
    } as unknown as jest.Mocked<SmsService>;

    emailService = {
      sendValidationCode: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;

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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('sendEmailValidation', () => {
    it('should send email validation code successfully', async () => {
      const dto = { email: 'test@example.com' };
      const mockValidationCode = {
        id: 'code-123',
        email: 'test@example.com',
        code: '12345678',
        verified: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      prisma.email_validation_codes.create.mockResolvedValue(mockValidationCode);
      emailService.sendValidationCode.mockResolvedValue({ success: true, message: 'Sent', email: 'test@example.com', expiresIn: 300 });

      const result = await service.sendEmailValidation(dto);

      expect(prisma.email_validation_codes.create).toHaveBeenCalled();
      expect(emailService.sendValidationCode).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Number),
        expect.any(Number),
        expect.any(Boolean)
      );
      expect(result).toHaveProperty('message');
    });

    it('should normalize email to lowercase', async () => {
      const dto = { email: 'TEST@EXAMPLE.COM' };
      const mockValidationCode = {
        id: 'code-123',
        email: 'test@example.com',
        code: '12345678',
        verified: false,
        expiresAt: new Date(),
      };

      prisma.email_validation_codes.create.mockResolvedValue(mockValidationCode);
      emailService.sendValidationCode.mockResolvedValue({ success: true, message: 'Sent', email: 'test@example.com', expiresIn: 300 });

      await service.sendEmailValidation(dto);

      expect(prisma.email_validation_codes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
          }),
        })
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

      prisma.email_validation_codes.create.mockResolvedValue(mockValidationCode);
      emailService.sendValidationCode.mockRejectedValue(new Error('Email service down'));

      await expect(service.sendEmailValidation(dto)).rejects.toThrow();
    });
  });

  describe('sendPhoneValidation', () => {
    it('should send phone validation code successfully', async () => {
      const dto = { phone: '+5511999999999' };
      const mockValidationCode = {
        id: 'code-456',
        phone: '+5511999999999',
        code: '12345678',
        verified: false,
        expiresAt: new Date(),
      };

      prisma.phone_validation_codes.create.mockResolvedValue(mockValidationCode);
      smsService.sendValidationCode.mockResolvedValue({ success: true, message: 'Sent', phone: '+5511999999999', expiresIn: 300 });

      const result = await service.sendPhoneValidation(dto);

      expect(prisma.phone_validation_codes.create).toHaveBeenCalled();
      expect(smsService.sendValidationCode).toHaveBeenCalledWith(
        '+5511999999999',
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
        expect.anything()
      );
      expect(result).toHaveProperty('message');
    });

    it('should normalize phone by removing non-digits', async () => {
      const dto = { phone: '+55 (11) 9 9999-9999' };
      const mockValidationCode = {
        id: 'code-456',
        phone: '5511999999999',
        code: '12345678',
        verified: false,
        expiresAt: new Date(),
      };

      prisma.phone_validation_codes.create.mockResolvedValue(mockValidationCode);
      smsService.sendValidationCode.mockResolvedValue({ success: true, message: 'Sent', phone: '5511999999999', expiresIn: 300 });

      await service.sendPhoneValidation(dto);

      expect(prisma.phone_validation_codes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '5511999999999',
          }),
        })
      );
    });
  });

  describe('verifyEmailCode', () => {
    it('should verify valid email code', async () => {
      const dto = { email: 'test@example.com', code: '12345678' };
      const mockValidationCode = {
        id: 'code-123',
        email: 'test@example.com',
        codeHash: '$2b$10$hashedcode',
        verified: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };

      prisma.email_validation_codes.findFirst.mockResolvedValue(mockValidationCode);
      prisma.email_validation_codes.update.mockResolvedValue({
        ...mockValidationCode,
        verified: true,
      });

      const result = await service.verifyEmailCode(dto);

      expect(prisma.email_validation_codes.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: 'test@example.com',
          }),
        })
      );
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('email');
    });

    it('should throw error if code expired', async () => {
      const dto = { email: 'test@example.com', code: '12345678' };

      prisma.email_validation_codes.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmailCode(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error if code invalid', async () => {
      const dto = { email: 'test@example.com', code: 'invalid' };
      const mockValidationCode = {
        id: 'code-123',
        email: 'test@example.com',
        codeHash: '$2b$10$hashedcode',
        verified: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };

      prisma.email_validation_codes.findFirst.mockResolvedValue(mockValidationCode);

      await expect(service.verifyEmailCode(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyPhoneCode', () => {
    it('should verify valid phone code', async () => {
      const dto = { phone: '+5511999999999', code: '12345678' };
      const mockValidationCode = {
        id: 'code-456',
        phone: '+5511999999999',
        codeHash: '$2b$10$hashedcode',
        verified: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };

      prisma.phone_validation_codes.findFirst.mockResolvedValue(mockValidationCode);
      prisma.phone_validation_codes.update.mockResolvedValue({
        ...mockValidationCode,
        verified: true,
      });

      const result = await service.verifyPhoneCode(dto);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('phone');
    });

    it('should throw error if phone code expired', async () => {
      const dto = { phone: '+5511999999999', code: '12345678' };

      prisma.phone_validation_codes.findFirst.mockResolvedValue(null);

      await expect(service.verifyPhoneCode(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('should send password recovery code for existing user', async () => {
      const dto = { email: 'test@example.com' };

      prisma.users.findFirst.mockResolvedValue(mockUser);
      prisma.email_validation_codes.create.mockResolvedValue({
        id: 'code-123',
        email: 'test@example.com',
        code: '12345678',
        verified: false,
        expiresAt: new Date(),
      });
      emailService.sendValidationCode.mockResolvedValue({ success: true, message: 'Sent', email: 'test@example.com', expiresIn: 300 });

      const result = await service.forgotPassword(dto);

      expect(prisma.users.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'test@example.com' },
        })
      );
      expect(emailService.sendValidationCode).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });

    it('should throw error if user does not exist', async () => {
      const dto = { email: 'nonexistent@example.com' };

      prisma.users.findFirst.mockResolvedValue(null);

      await expect(service.forgotPassword(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyPassword', () => {
    it('should verify password recovery code and reset password', async () => {
      const dto = {
        email: 'test@example.com',
        code: '12345678',
        newPassword: 'NewPassword123!',
      };

      const mockValidationCode = {
        id: 'code-123',
        email: 'test@example.com',
        codeHash: '$2b$10$hashedcode',
        verified: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };

      prisma.email_validation_codes.findFirst.mockResolvedValue(mockValidationCode);
      prisma.users.update.mockResolvedValue({
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

      prisma.email_validation_codes.findFirst.mockResolvedValue(null);

      await expect(service.verifyPassword(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('unlockAccount', () => {
    it('should unlock account with valid credentials', async () => {
      const dto = { id: 'user-123', password: 'ValidPassword123!' };

      prisma.users.findUnique.mockResolvedValue(mockUser);
      prisma.users.update.mockResolvedValue({ ...mockUser, status: 'active' });

      const result = await service.unlockAccount(dto);

      expect(prisma.users.update).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });

    it('should throw error if credentials invalid', async () => {
      const dto = { id: 'user-123', password: 'WrongPassword' };

      prisma.users.findUnique.mockResolvedValue(null);

      await expect(service.unlockAccount(dto)).rejects.toThrow(BadRequestException);
    });
  });
});
