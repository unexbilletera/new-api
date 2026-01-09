import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from '../../../../src/public/auth/controllers/auth.controller';
import { AuthService } from '../../../../src/public/auth/services/auth.service';
import { SignupService } from '../../../../src/public/auth/services/signup.service';
import { PrismaService } from '../../../../src/shared/prisma/prisma.service';
import { JwtService } from '../../../../src/shared/jwt/jwt.service';
import { EmailService } from '../../../../src/shared/email/email.service';
import { SmsService } from '../../../../src/shared/sms/sms.service';
import { LoggerService } from '../../../../src/shared/logger/logger.service';
import { NotificationService } from '../../../../src/shared/notifications/notifications.service';
import { AccessLogService } from '../../../../src/shared/access-log/access-log.service';
import { CronosService } from '../../../../src/shared/cronos/cronos.service';
import { ExchangeRatesService } from '../../../../src/shared/exchange/exchange-rates.service';
import { SystemVersionService } from '../../../../src/shared/helpers/system-version.service';
import { AuthUserModel } from '../../../../src/public/auth/models/user.model';
import { ValidationCodeModel } from '../../../../src/public/auth/models/validation-code.model';
import { AuthMapper } from '../../../../src/public/auth/mappers/auth.mapper';

describe('Auth Integration Tests (Controller + Service)', () => {
  let controller: AuthController;
  let authService: AuthService;
  let signupService: SignupService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;
  let smsService: jest.Mocked<SmsService>;

  const mockSignupDto = {
    email: 'newuser@example.com',
    phone: '+5511999999999',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe',
    language: 'pt',
  };

  const mockNewUser = {
    id: 'user-uuid-123',
    email: 'newuser@example.com',
    phone: '+5511999999999',
    firstName: 'John',
    lastName: 'Doe',
    status: 'pending',
    createdAt: new Date(),
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

    emailService = {
      sendValidationCode: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;

    smsService = {
      sendValidationCode: jest.fn(),
    } as unknown as jest.Mocked<SmsService>;

    const logger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    const notificationService = {
      send: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    const accessLogService = {
      log: jest.fn(),
    } as unknown as jest.Mocked<AccessLogService>;

    const cronosService = {
      schedule: jest.fn(),
    } as unknown as jest.Mocked<CronosService>;

    const exchangeRatesService = {
      getRates: jest.fn(),
    } as unknown as jest.Mocked<ExchangeRatesService>;

    const systemVersionService = {
      getVersion: jest.fn(),
    } as unknown as jest.Mocked<SystemVersionService>;

    const userModel = {
      exists: jest.fn(),
      create: jest.fn(),
      findByEmail: jest.fn(),
    } as unknown as jest.Mocked<AuthUserModel>;

    const validationCodeModel = {
      getValidatedEmailCode: jest.fn(),
      getValidatedPhoneCode: jest.fn(),
      deleteEmailValidationCodes: jest.fn(),
      deletePhoneValidationCodes: jest.fn(),
    } as unknown as jest.Mocked<ValidationCodeModel>;

    const authMapper = {
      toSignupResponseDto: jest.fn(),
    } as unknown as jest.Mocked<AuthMapper>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        SignupService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
        { provide: SmsService, useValue: smsService },
        { provide: LoggerService, useValue: logger },
        { provide: NotificationService, useValue: notificationService },
        { provide: AccessLogService, useValue: accessLogService },
        { provide: CronosService, useValue: cronosService },
        { provide: ExchangeRatesService, useValue: exchangeRatesService },
        { provide: SystemVersionService, useValue: systemVersionService },
        { provide: AuthUserModel, useValue: userModel },
        { provide: ValidationCodeModel, useValue: validationCodeModel },
        { provide: AuthMapper, useValue: authMapper },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    signupService = module.get<SignupService>(SignupService);
  });

  describe('Signup flow (Controller → Service → Prisma)', () => {
    it('should complete full signup flow successfully', async () => {
      prisma.users.findFirst.mockResolvedValue(null);

      prisma.email_validation_codes.findFirst.mockResolvedValue({
        email: 'newuser@example.com',
        verified: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      prisma.phone_validation_codes.findFirst.mockResolvedValue({
        phone: '+5511999999999',
        verified: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      prisma.users.create.mockResolvedValue(mockNewUser);

      jwtService.generateToken.mockResolvedValue('jwt_token_123');

      const result = await controller.signup(mockSignupDto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');

      expect(prisma.users.create).toHaveBeenCalled();
      expect(prisma.email_validation_codes.deleteMany).toHaveBeenCalled();
      expect(prisma.phone_validation_codes.deleteMany).toHaveBeenCalled();

      expect(jwtService.generateToken).toHaveBeenCalled();
    });

    it('should validate email before signup', async () => {
      prisma.users.findFirst.mockResolvedValue(null);

      prisma.email_validation_codes.findFirst.mockResolvedValue(null);

      await expect(controller.signup(mockSignupDto)).rejects.toThrow(BadRequestException);

      expect(prisma.users.create).not.toHaveBeenCalled();
    });

    it('should validate phone before signup', async () => {
      prisma.users.findFirst.mockResolvedValue(null);

      prisma.email_validation_codes.findFirst.mockResolvedValue({
        verified: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      prisma.phone_validation_codes.findFirst.mockResolvedValue(null);

      await expect(controller.signup(mockSignupDto)).rejects.toThrow(BadRequestException);

      expect(prisma.users.create).not.toHaveBeenCalled();
    });

    it('should prevent duplicate user registration', async () => {
      prisma.users.findFirst.mockResolvedValue(mockNewUser);

      await expect(controller.signup(mockSignupDto)).rejects.toThrow(BadRequestException);

      expect(prisma.email_validation_codes.findFirst).not.toHaveBeenCalled();
    });

    it('should clean up validation codes after signup', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      prisma.email_validation_codes.findFirst.mockResolvedValue({
        verified: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });
      prisma.phone_validation_codes.findFirst.mockResolvedValue({
        verified: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });
      prisma.users.create.mockResolvedValue(mockNewUser);
      jwtService.generateToken.mockResolvedValue('jwt_token_123');

      await controller.signup(mockSignupDto);

      expect(prisma.email_validation_codes.deleteMany).toHaveBeenCalledWith({
        where: { email: 'newuser@example.com' },
      });
      expect(prisma.phone_validation_codes.deleteMany).toHaveBeenCalledWith({
        where: { phone: '+5511999999999' },
      });
    });

    it('should normalize email and phone in signup flow', async () => {
      const dtoWithFormattedData = {
        ...mockSignupDto,
        email: '  NEWUSER@EXAMPLE.COM  ',
        phone: '+55 (11) 9 9999-9999',
      };

      prisma.users.findFirst.mockResolvedValue(null);
      prisma.email_validation_codes.findFirst.mockResolvedValue({
        verified: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });
      prisma.phone_validation_codes.findFirst.mockResolvedValue({
        verified: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });
      prisma.users.create.mockResolvedValue(mockNewUser);
      jwtService.generateToken.mockResolvedValue('jwt_token_123');

      await controller.signup(dtoWithFormattedData);

      expect(prisma.users.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ email: 'newuser@example.com' }),
              expect.objectContaining({ phone: '5511999999999' }),
            ]),
          }),
        })
      );
    });
  });

  describe('Email validation flow', () => {
    it('should send email validation code via service', async () => {
      const dto = { email: 'test@example.com' };

      prisma.email_validation_codes.create.mockResolvedValue({
        id: 'code-123',
        email: 'test@example.com',
        code: '12345678',
        verified: false,
        expiresAt: new Date(),
      });
      emailService.sendValidationCode.mockResolvedValue({ 
        success: true, 
        message: 'Sent', 
        email: 'test@example.com', 
        expiresIn: 300 
      });

      const result = await controller.sendEmailValidation(dto);

      expect(prisma.email_validation_codes.create).toHaveBeenCalled();
      expect(emailService.sendValidationCode).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Number),
        expect.any(Number),
        expect.any(Boolean)
      );
      expect(result).toHaveProperty('message');
    });
  });

  describe('Phone validation flow', () => {
    it('should send phone validation code via service', async () => {
      const dto = { phone: '+5511999999999' };

      prisma.phone_validation_codes.create.mockResolvedValue({
        id: 'code-456',
        phone: '+5511999999999',
        code: '12345678',
        verified: false,
        expiresAt: new Date(),
      });
      smsService.sendValidationCode.mockResolvedValue({ 
        success: true, 
        message: 'Sent', 
        phone: '+5511999999999', 
        expiresIn: 300 
      });

      const result = await controller.sendPhoneValidation(dto);

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
  });
});
