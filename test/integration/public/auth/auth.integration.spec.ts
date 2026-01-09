import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from '../../../../src/public/auth/controllers/auth.controller';
import { SignupService } from '../../../../src/public/auth/services/signup.service';
import { SigninService } from '../../../../src/public/auth/services/signin.service';
import { EmailValidationService } from '../../../../src/public/auth/services/email-validation.service';
import { PhoneValidationService } from '../../../../src/public/auth/services/phone-validation.service';
import { PasswordRecoveryService } from '../../../../src/public/auth/services/password-recovery.service';
import { TokenService } from '../../../../src/public/auth/services/token.service';
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
  let signupService: SignupService;
  let userModel: jest.Mocked<AuthUserModel>;
  let validationCodeModel: jest.Mocked<ValidationCodeModel>;
  let signinService: jest.Mocked<SigninService>;
  let emailValidationService: jest.Mocked<EmailValidationService>;
  let phoneValidationService: jest.Mocked<PhoneValidationService>;
  let passwordRecoveryService: jest.Mocked<PasswordRecoveryService>;
  let tokenService: jest.Mocked<TokenService>;
  let prisma: any;
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

  const prismaUser: any = {
    number: 1,
    id: mockNewUser.id,
    email: mockNewUser.email,
    phone: mockNewUser.phone,
    name: `${mockNewUser.firstName} ${mockNewUser.lastName}`,
    firstName: mockNewUser.firstName,
    lastName: mockNewUser.lastName,
    status: 'pending',
    access: 'user',
    isBlocked: false,
    blockedAt: null,
    blockedReason: null,
    isDisabled: false,
    disableReason: null,
    language: 'pt',
    onboardingState: { completedSteps: [], needsCorrection: [] },
    createdAt: mockNewUser.createdAt,
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      users: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      devices: {
        findFirst: jest.fn(),
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
    } as any;

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

    userModel = {
      exists: jest.fn(),
      create: jest.fn(),
      findByEmail: jest.fn(),
    } as unknown as jest.Mocked<AuthUserModel>;
    userModel.exists.mockResolvedValue(false as any);
    userModel.create.mockResolvedValue(mockNewUser as any);

    validationCodeModel = {
      getValidatedEmailCode: jest.fn(),
      getValidatedPhoneCode: jest.fn(),
      deleteEmailValidationCodes: jest.fn(),
      deletePhoneValidationCodes: jest.fn(),
    } as unknown as jest.Mocked<ValidationCodeModel>;
    validationCodeModel.getValidatedEmailCode.mockResolvedValue({ verified: true } as any);
    validationCodeModel.getValidatedPhoneCode.mockResolvedValue({ verified: true } as any);
    prisma.devices.findFirst.mockResolvedValue(null as any);

    const authMapper = {
      toSignupResponseDto: jest.fn(),
      toSignupDeviceRequiredResponseDto: jest.fn(),
    } as unknown as jest.Mocked<AuthMapper>;
    authMapper.toSignupResponseDto.mockReturnValue({ user: mockNewUser, accessToken: 'token', expiresIn: 3600 } as any);
    authMapper.toSignupDeviceRequiredResponseDto.mockReturnValue({ user: mockNewUser, accessToken: 'token', expiresIn: 3600, deviceRequired: true } as any);

    signinService = { signin: jest.fn() } as unknown as jest.Mocked<SigninService>;
    emailValidationService = { sendEmailValidation: jest.fn(), verifyEmailCode: jest.fn() } as unknown as jest.Mocked<EmailValidationService>;
    phoneValidationService = { sendPhoneValidation: jest.fn(), verifyPhoneCode: jest.fn() } as unknown as jest.Mocked<PhoneValidationService>;
    passwordRecoveryService = {
      forgotPassword: jest.fn(),
      verifyPassword: jest.fn(),
      unlockAccount: jest.fn(),
    } as unknown as jest.Mocked<PasswordRecoveryService>;
    tokenService = { getToken: jest.fn() } as unknown as jest.Mocked<TokenService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        SignupService,
        { provide: SigninService, useValue: signinService },
        { provide: EmailValidationService, useValue: emailValidationService },
        { provide: PhoneValidationService, useValue: phoneValidationService },
        { provide: PasswordRecoveryService, useValue: passwordRecoveryService },
        { provide: TokenService, useValue: tokenService },
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
    signupService = module.get<SignupService>(SignupService);
  });

  describe('Signup flow (Controller → Service → Prisma)', () => {
    it('should complete full signup flow successfully', async () => {
      userModel.exists?.mockResolvedValue?.(false as any);
      userModel.create?.mockResolvedValue?.(prismaUser as any);
      prisma.users.findFirst.mockResolvedValue(null as any);

      prisma.email_validation_codes.findFirst.mockResolvedValue({
        email: 'newuser@example.com',
        verified: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      } as any);

      prisma.phone_validation_codes.findFirst.mockResolvedValue({
        phone: '+5511999999999',
        verified: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      } as any);

      prisma.users.create.mockResolvedValue(prismaUser as any);
      prisma.users.create.mockResolvedValue(prismaUser as any);
      prisma.users.create.mockResolvedValue(prismaUser as any);

      jwtService.generateToken.mockResolvedValue('jwt_token_123');

      const result = await controller.signup(mockSignupDto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');

      expect(userModel.create).toHaveBeenCalled();
      expect(validationCodeModel.deleteEmailValidationCodes).toHaveBeenCalledWith('newuser@example.com');
      expect(validationCodeModel.deletePhoneValidationCodes).toHaveBeenCalledWith('5511999999999');

      expect(jwtService.generateToken).toHaveBeenCalled();
    });

    it('should validate email before signup', async () => {
      userModel.exists?.mockResolvedValue?.(false as any);
      prisma.users.findFirst.mockResolvedValue(null as any);

      validationCodeModel.getValidatedEmailCode.mockResolvedValue(null as any);
      validationCodeModel.getValidatedPhoneCode.mockResolvedValue({ verified: true } as any);

      await expect(controller.signup(mockSignupDto)).rejects.toThrow(BadRequestException);

      expect(prisma.users.create).not.toHaveBeenCalled();
    });

    it('should validate phone before signup', async () => {
      userModel.exists?.mockResolvedValue?.(false as any);
      prisma.users.findFirst.mockResolvedValue(null as any);

      validationCodeModel.getValidatedEmailCode.mockResolvedValue({ verified: true } as any);
      validationCodeModel.getValidatedPhoneCode.mockResolvedValue(null as any);

      await expect(controller.signup(mockSignupDto)).rejects.toThrow(BadRequestException);

      expect(prisma.users.create).not.toHaveBeenCalled();
    });

    it('should prevent duplicate user registration', async () => {
      userModel.exists?.mockResolvedValue?.(true as any);
      validationCodeModel.getValidatedEmailCode.mockResolvedValue({ verified: true } as any);
      validationCodeModel.getValidatedPhoneCode.mockResolvedValue({ verified: true } as any);
      prisma.users.findFirst.mockResolvedValue(mockNewUser as any);

      await expect(controller.signup(mockSignupDto)).rejects.toThrow(BadRequestException);

      expect(prisma.email_validation_codes.findFirst).not.toHaveBeenCalled();
    });

    it('should clean up validation codes after signup', async () => {
      userModel.exists?.mockResolvedValue?.(false as any);
      userModel.create?.mockResolvedValue?.(prismaUser as any);
      prisma.users.findFirst.mockResolvedValue(null as any);
      prisma.email_validation_codes.findFirst.mockResolvedValue({
        verified: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      } as any);
      prisma.phone_validation_codes.findFirst.mockResolvedValue({
        verified: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      } as any);
      userModel.create.mockResolvedValue(prismaUser);
      jwtService.generateToken.mockResolvedValue('jwt_token_123');

      await controller.signup(mockSignupDto);

      expect(validationCodeModel.deleteEmailValidationCodes).toHaveBeenCalledWith('newuser@example.com');
      expect(validationCodeModel.deletePhoneValidationCodes).toHaveBeenCalledWith('5511999999999');
    });

    it('should normalize email and phone in signup flow', async () => {
      const dtoWithFormattedData = {
        ...mockSignupDto,
        email: '  NEWUSER@EXAMPLE.COM  ',
        phone: '+55 (11) 9 9999-9999',
      };

      userModel.exists?.mockResolvedValue?.(false as any);
      userModel.create?.mockResolvedValue?.(prismaUser as any);
      prisma.users.findFirst.mockResolvedValue(null as any);
      prisma.email_validation_codes.findFirst.mockResolvedValue({
        verified: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      } as any);
      prisma.phone_validation_codes.findFirst.mockResolvedValue({
        verified: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      } as any);
      userModel.create.mockResolvedValue(prismaUser as any);
      userModel.create.mockResolvedValue(prismaUser as any);
      jwtService.generateToken.mockResolvedValue('jwt_token_123');

      await controller.signup(dtoWithFormattedData);

      expect(userModel.exists).toHaveBeenCalledWith('newuser@example.com', '5511999999999');
    });
  });

  describe('Email validation flow', () => {
    it('should send email validation code via service', async () => {
      const dto = { email: 'test@example.com' };

      emailValidationService.sendEmailValidation.mockResolvedValue({ message: 'Sent', debug: '123' } as any);

      const result = await controller.sendEmailValidation(dto);

      expect(emailValidationService.sendEmailValidation).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('message');
    });
  });

  describe('Phone validation flow', () => {
    it('should send phone validation code via service', async () => {
      const dto = { phone: '+5511999999999' };

      phoneValidationService.sendPhoneValidation.mockResolvedValue({ message: 'Sent', debug: '456' } as any);

      const result = await controller.sendPhoneValidation(dto);

      expect(phoneValidationService.sendPhoneValidation).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('message');
    });
  });
});
