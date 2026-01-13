import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { AuthController, SecurityController } from '../../../../../src/public/auth/controllers/auth.controller';
import { SignupService } from '../../../../../src/public/auth/services/signup.service';
import { SigninService } from '../../../../../src/public/auth/services/signin.service';
import { EmailValidationService } from '../../../../../src/public/auth/services/email-validation.service';
import { PhoneValidationService } from '../../../../../src/public/auth/services/phone-validation.service';
import { PasswordRecoveryService } from '../../../../../src/public/auth/services/password-recovery.service';
import { TokenService } from '../../../../../src/public/auth/services/token.service';

describe('AuthController', () => {
  let controller: AuthController;
  let security: SecurityController;
  let signupService: jest.Mocked<SignupService>;
  let signinService: jest.Mocked<SigninService>;
  let emailValidationService: jest.Mocked<EmailValidationService>;
  let phoneValidationService: jest.Mocked<PhoneValidationService>;
  let passwordRecoveryService: jest.Mocked<PasswordRecoveryService>;
  let tokenService: jest.Mocked<TokenService>;
  let mockRequest: Partial<Request>;

  const mockUser = { id: '1', email: 'test@example.com', firstName: 'John', lastName: 'Doe', phone: '+5511999999999' };

  beforeEach(async () => {
    signupService = { signup: jest.fn() } as unknown as jest.Mocked<SignupService>;
    signinService = { signin: jest.fn() } as unknown as jest.Mocked<SigninService>;
    emailValidationService = {
      sendEmailValidation: jest.fn(),
      verifyEmailCode: jest.fn(),
    } as unknown as jest.Mocked<EmailValidationService>;
    phoneValidationService = {
      sendPhoneValidation: jest.fn(),
      verifyPhoneCode: jest.fn(),
    } as unknown as jest.Mocked<PhoneValidationService>;
    passwordRecoveryService = {
      forgotPassword: jest.fn(),
      verifyPassword: jest.fn(),
      unlockAccount: jest.fn(),
    } as unknown as jest.Mocked<PasswordRecoveryService>;
    tokenService = { getToken: jest.fn() } as unknown as jest.Mocked<TokenService>;

    mockRequest = {
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController, SecurityController],
      providers: [
        { provide: SignupService, useValue: signupService },
        { provide: SigninService, useValue: signinService },
        { provide: EmailValidationService, useValue: emailValidationService },
        { provide: PhoneValidationService, useValue: phoneValidationService },
        { provide: PasswordRecoveryService, useValue: passwordRecoveryService },
        { provide: TokenService, useValue: tokenService },
      ],
    }).compile();

    controller = module.get(AuthController);
    security = module.get(SecurityController);
  });

  describe('signup', () => {
    it('should delegate to service', async () => {
      const dto = { email: 'test@example.com', password: 'password123', phone: '+5511999999999', language: 'pt-BR' };
      const payload = {
        user: mockUser,
        accessToken: 't',
        expiresIn: 3600,
      };
      signupService.signup.mockResolvedValue(payload);

      const result = await controller.signup(dto);

      expect(result).toEqual(payload);
      expect(signupService.signup).toHaveBeenCalledWith(dto);
    });

    it('should propagate service errors', async () => {
      const dto = { email: 'e@mail.com', password: 'pass123', phone: '+5511999999999', language: 'pt-BR' };
      signupService.signup.mockRejectedValue(new Error('signup failed'));

      await expect(controller.signup(dto)).rejects.toThrow('signup failed');
      expect(signupService.signup).toHaveBeenCalledWith(dto);
    });

    it('should return user data with access token', async () => {
      const dto = { email: 'newuser@example.com', password: 'secure123', phone: '+5511999999999', language: 'pt-BR' };
      const payload = {
        user: mockUser,
        accessToken: 'access_token_123',
        expiresIn: 3600,
      };
      signupService.signup.mockResolvedValue(payload);

      const result = await controller.signup(dto);

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      if ('expiresIn' in result) {
        expect(result.expiresIn).toEqual(3600);
      }
    });
  });

  describe('signin', () => {
    it('should delegate to service with request metadata', async () => {
      const dto = { identifier: 'user', password: 'secret' };
      const payload = {
        user: mockUser,
        accessToken: 'a',
        refreshToken: 'r',
        expiresIn: 3600,
      };
      signinService.signin.mockResolvedValue(payload);

      const result = await controller.signin(dto, mockRequest as Request);

      expect(result).toEqual(payload);
      expect(signinService.signin).toHaveBeenCalledWith(dto, { ipAddress: '127.0.0.1', userAgent: 'test-agent' });
    });

    it('should return user data with access and refresh tokens', async () => {
      const dto = { identifier: 'user', password: 'secret' };
      const payload = {
        user: mockUser,
        accessToken: 'abc',
        refreshToken: 'def',
        expiresIn: 3600,
      };
      signinService.signin.mockResolvedValue(payload);

      const result = await controller.signin(dto, mockRequest as Request);

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      if ('refreshToken' in result) {
        expect(result.refreshToken).toBeDefined();
      }
    });

    it('should propagate service errors', async () => {
      const dto = { identifier: 'user', password: 'wrong' };
      signinService.signin.mockRejectedValue(new Error('invalid credentials'));

      await expect(controller.signin(dto, mockRequest as Request)).rejects.toThrow('invalid credentials');
    });
  });

  describe('email validation', () => {
    it('sendEmailValidation should delegate to service', async () => {
      const dto = { email: 'test@example.com' };
      const payload = { message: 'ok', debug: '123' };
      emailValidationService.sendEmailValidation.mockResolvedValue(payload);

      const result = await controller.sendEmailValidation(dto);

      expect(result).toEqual(payload);
      expect(emailValidationService.sendEmailValidation).toHaveBeenCalledWith(dto);
    });

    it('verifyEmailCode should delegate to service', async () => {
      const dto = { email: 'test@example.com', code: '123456' };
      const payload = { message: 'ok', email: 'test@example.com', nextStep: 'password' };
      emailValidationService.verifyEmailCode.mockResolvedValue(payload);

      const result = await controller.verifyEmailCode(dto);

      expect(result).toEqual(payload);
      expect(emailValidationService.verifyEmailCode).toHaveBeenCalledWith(dto);
    });

    it('verifyEmailCode should propagate service errors', async () => {
      const dto = { email: 'test@example.com', code: 'invalid' };
      emailValidationService.verifyEmailCode.mockRejectedValue(new Error('invalid code'));

      await expect(controller.verifyEmailCode(dto)).rejects.toThrow('invalid code');
    });
  });

  describe('phone validation', () => {
    it('sendPhoneValidation should delegate to service', async () => {
      const dto = { phone: '+5511999999999' };
      const payload = { message: 'ok', debug: '456' };
      phoneValidationService.sendPhoneValidation.mockResolvedValue(payload);

      const result = await controller.sendPhoneValidation(dto);

      expect(result).toEqual(payload);
      expect(phoneValidationService.sendPhoneValidation).toHaveBeenCalledWith(dto);
    });

    it('verifyPhoneCode should delegate to service', async () => {
      const dto = { phone: '+5511999999999', code: '123456' };
      const payload = { message: 'ok', phone: '+5511999999999', nextStep: 'password' };
      phoneValidationService.verifyPhoneCode.mockResolvedValue(payload);

      const result = await controller.verifyPhoneCode(dto);

      expect(result).toEqual(payload);
      expect(phoneValidationService.verifyPhoneCode).toHaveBeenCalledWith(dto);
    });

    it('verifyPhoneCode should return phone and next step', async () => {
      const dto = { phone: '+5511999999999', code: '123456' };
      const payload = { message: 'ok', phone: '+5511999999999', nextStep: 'password' };
      phoneValidationService.verifyPhoneCode.mockResolvedValue(payload);

      const result = await controller.verifyPhoneCode(dto);

      expect(result.phone).toEqual('+5511999999999');
      expect(result.nextStep).toEqual('password');
    });

    it('verifyPhoneCode should propagate service errors', async () => {
      const dto = { phone: '+5511999999999', code: 'invalid' };
      phoneValidationService.verifyPhoneCode.mockRejectedValue(new Error('invalid code'));

      await expect(controller.verifyPhoneCode(dto)).rejects.toThrow('invalid code');
    });
  });

  describe('password recovery', () => {
    it('forgotPassword should delegate to service', async () => {
      const dto = { email: 'test@example.com' };
      const payload = { message: 'ok', debug: '111' };
      passwordRecoveryService.forgotPassword.mockResolvedValue(payload);

      const result = await controller.forgotPassword(dto);

      expect(result).toEqual(payload);
      expect(passwordRecoveryService.forgotPassword).toHaveBeenCalledWith(dto);
    });

    it('verify should delegate to service', async () => {
      const dto = { email: 'test@example.com', code: '123456', newPassword: 'newpass123' };
      const payload = { message: 'ok' };
      passwordRecoveryService.verifyPassword.mockResolvedValue(payload);

      const result = await controller.verify(dto);

      expect(result).toEqual(payload);
      expect(passwordRecoveryService.verifyPassword).toHaveBeenCalledWith(dto);
    });

    it('verify should propagate service errors', async () => {
      const dto = { email: 'test@example.com', code: 'invalid', newPassword: 'newpass123' };
      passwordRecoveryService.verifyPassword.mockRejectedValue(new Error('invalid code'));

      await expect(controller.verify(dto)).rejects.toThrow('invalid code');
    });
  });

  describe('account management', () => {
    it('unlock should delegate to service', async () => {
      const dto = { id: 'user-123', password: 'Password123!' };
      const payload = {
        user: {
          ...mockUser,
          status: 'enable',
          access: 'customer',
        },
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 3600,
        message: 'Account unlocked',
      };
      passwordRecoveryService.unlockAccount.mockResolvedValue(payload);

      const result = await controller.unlock(dto, mockRequest as Request);

      expect(result).toEqual(payload);
      expect(passwordRecoveryService.unlockAccount).toHaveBeenCalledWith(dto, { ipAddress: '127.0.0.1', userAgent: 'test-agent' });
    });

    it('unlock should propagate service errors', async () => {
      const dto = { id: 'user-123', password: 'Password123!' };
      passwordRecoveryService.unlockAccount.mockRejectedValue(new Error('unlock failed'));

      await expect(controller.unlock(dto, mockRequest as Request)).rejects.toThrow('unlock failed');
    });
  });

  describe('SecurityController - getToken', () => {
    it('should delegate to service', async () => {
      const payload = { accessToken: 'token', tokenType: 'Bearer', expiresIn: 3600 };
      tokenService.getToken.mockResolvedValue(payload);

      const result = await security.getToken();

      expect(result).toEqual(payload);
      expect(tokenService.getToken).toHaveBeenCalled();
    });

    it('should return valid token response', async () => {
      const payload = { accessToken: 'token_abc123', tokenType: 'Bearer', expiresIn: 3600 };
      tokenService.getToken.mockResolvedValue(payload);

      const result = await security.getToken();

      expect(result.accessToken).toBeDefined();
      expect(result.tokenType).toEqual('Bearer');
      expect(result.expiresIn).toEqual(3600);
    });

    it('should propagate service errors', async () => {
      tokenService.getToken.mockRejectedValue(new Error('token failed'));

      await expect(security.getToken()).rejects.toThrow('token failed');
      expect(tokenService.getToken).toHaveBeenCalled();
    });
  });
});
