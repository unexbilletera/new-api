import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { AuthController, SecurityController } from '../../../../src/public/auth/controllers/auth.controller';
import { AuthService } from '../../../../src/public/auth/services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let security: SecurityController;
  let service: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;

  const mockUser = { id: '1', email: 'test@example.com', firstName: 'John', lastName: 'Doe', phone: '+5511999999999' };

  beforeEach(async () => {
    service = {
      signup: jest.fn(),
      signin: jest.fn(),
      sendEmailValidation: jest.fn(),
      verifyEmailCode: jest.fn(),
      sendPhoneValidation: jest.fn(),
      verifyPhoneCode: jest.fn(),
      forgotPassword: jest.fn(),
      verifyPassword: jest.fn(),
      unlockAccount: jest.fn(),
      getToken: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    mockRequest = {
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController, SecurityController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get(AuthController);
    security = module.get(SecurityController);
  });

  describe('signup', () => {
    it('should delegate to service', async () => {
      const dto = { email: 'test@example.com', password: 'password123' } as any;
      const payload = {
        user: mockUser,
        accessToken: 't',
        expiresIn: 3600,
      };
      service.signup.mockResolvedValue(payload);

      const result = await controller.signup(dto);

      expect(result).toEqual(payload);
      expect(service.signup).toHaveBeenCalledWith(dto);
    });

    it('should propagate service errors', async () => {
      const dto = { email: 'e@mail.com' } as any;
      service.signup.mockRejectedValue(new Error('signup failed'));

      await expect(controller.signup(dto)).rejects.toThrow('signup failed');
      expect(service.signup).toHaveBeenCalledWith(dto);
    });

    it('should return user data with access token', async () => {
      const dto = { email: 'newuser@example.com', password: 'secure123' } as any;
      const payload = {
        user: mockUser,
        accessToken: 'access_token_123',
        expiresIn: 3600,
      };
      service.signup.mockResolvedValue(payload);

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
      const dto = { identifier: 'user', password: 'secret' } as any;
      const payload = {
        user: mockUser,
        accessToken: 'a',
        refreshToken: 'r',
        expiresIn: 3600,
      };
      service.signin.mockResolvedValue(payload);

      const result = await controller.signin(dto, mockRequest as Request);

      expect(result).toEqual(payload);
      expect(service.signin).toHaveBeenCalledWith(dto, { ipAddress: '127.0.0.1', userAgent: 'test-agent' });
    });

    it('should return user data with access and refresh tokens', async () => {
      const dto = { identifier: 'user', password: 'secret' } as any;
      const payload = {
        user: mockUser,
        accessToken: 'abc',
        refreshToken: 'def',
        expiresIn: 3600,
      };
      service.signin.mockResolvedValue(payload);

      const result = await controller.signin(dto, mockRequest as Request);

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      if ('refreshToken' in result) {
        expect(result.refreshToken).toBeDefined();
      }
    });

    it('should propagate service errors', async () => {
      const dto = { identifier: 'user', password: 'wrong' } as any;
      service.signin.mockRejectedValue(new Error('invalid credentials'));

      await expect(controller.signin(dto, mockRequest as Request)).rejects.toThrow('invalid credentials');
    });
  });

  describe('email validation', () => {
    it('sendEmailValidation should delegate to service', async () => {
      const dto = { email: 'test@example.com' } as any;
      const payload = { message: 'ok', debug: '123' };
      service.sendEmailValidation.mockResolvedValue(payload);

      const result = await controller.sendEmailValidation(dto);

      expect(result).toEqual(payload);
      expect(service.sendEmailValidation).toHaveBeenCalledWith(dto);
    });

    it('verifyEmailCode should delegate to service', async () => {
      const dto = { email: 'test@example.com', code: '123456' } as any;
      const payload = { message: 'ok', email: 'test@example.com', nextStep: 'password' };
      service.verifyEmailCode.mockResolvedValue(payload);

      const result = await controller.verifyEmailCode(dto);

      expect(result).toEqual(payload);
      expect(service.verifyEmailCode).toHaveBeenCalledWith(dto);
    });

    it('verifyEmailCode should propagate service errors', async () => {
      const dto = { email: 'test@example.com', code: 'invalid' } as any;
      service.verifyEmailCode.mockRejectedValue(new Error('invalid code'));

      await expect(controller.verifyEmailCode(dto)).rejects.toThrow('invalid code');
    });
  });

  describe('phone validation', () => {
    it('sendPhoneValidation should delegate to service', async () => {
      const dto = { phone: '+5511999999999' } as any;
      const payload = { message: 'ok', debug: '456' };
      service.sendPhoneValidation.mockResolvedValue(payload);

      const result = await controller.sendPhoneValidation(dto);

      expect(result).toEqual(payload);
      expect(service.sendPhoneValidation).toHaveBeenCalledWith(dto);
    });

    it('verifyPhoneCode should delegate to service', async () => {
      const dto = { phone: '+5511999999999', code: '123456' } as any;
      const payload = { message: 'ok', phone: '+5511999999999', nextStep: 'password' };
      service.verifyPhoneCode.mockResolvedValue(payload);

      const result = await controller.verifyPhoneCode(dto);

      expect(result).toEqual(payload);
      expect(service.verifyPhoneCode).toHaveBeenCalledWith(dto);
    });

    it('verifyPhoneCode should return phone and next step', async () => {
      const dto = { phone: '+5511999999999', code: '123456' } as any;
      const payload = { message: 'ok', phone: '+5511999999999', nextStep: 'password' };
      service.verifyPhoneCode.mockResolvedValue(payload);

      const result = await controller.verifyPhoneCode(dto);

      expect(result.phone).toEqual('+5511999999999');
      expect(result.nextStep).toEqual('password');
    });

    it('verifyPhoneCode should propagate service errors', async () => {
      const dto = { phone: '+5511999999999', code: 'invalid' } as any;
      service.verifyPhoneCode.mockRejectedValue(new Error('invalid code'));

      await expect(controller.verifyPhoneCode(dto)).rejects.toThrow('invalid code');
    });
  });

  describe('password recovery', () => {
    it('forgotPassword should delegate to service', async () => {
      const dto = { email: 'test@example.com' } as any;
      const payload = { message: 'ok', debug: '111' };
      service.forgotPassword.mockResolvedValue(payload);

      const result = await controller.forgotPassword(dto);

      expect(result).toEqual(payload);
      expect(service.forgotPassword).toHaveBeenCalledWith(dto);
    });

    it('verify should delegate to service', async () => {
      const dto = { email: 'test@example.com', code: '123456', newPassword: 'newpass123' } as any;
      const payload = { message: 'ok' };
      service.verifyPassword.mockResolvedValue(payload);

      const result = await controller.verify(dto);

      expect(result).toEqual(payload);
      expect(service.verifyPassword).toHaveBeenCalledWith(dto);
    });

    it('verify should propagate service errors', async () => {
      const dto = { email: 'test@example.com', code: 'invalid' } as any;
      service.verifyPassword.mockRejectedValue(new Error('invalid code'));

      await expect(controller.verify(dto)).rejects.toThrow('invalid code');
    });
  });

  describe('account management', () => {
    it('unlock should delegate to service', async () => {
      const dto = { id: 'user-123', password: 'Password123!' } as any;
      const payload = {
        user: mockUser,
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 3600,
        message: 'Account unlocked',
      };
      service.unlockAccount.mockResolvedValue(payload);

      const result = await controller.unlock(dto, mockRequest as Request);

      expect(result).toEqual(payload);
      expect(service.unlockAccount).toHaveBeenCalledWith(dto, { ipAddress: '127.0.0.1', userAgent: 'test-agent' });
    });

    it('unlock should propagate service errors', async () => {
      const dto = { id: 'user-123', password: 'Password123!' } as any;
      service.unlockAccount.mockRejectedValue(new Error('unlock failed'));

      await expect(controller.unlock(dto, mockRequest as Request)).rejects.toThrow('unlock failed');
    });
  });

  describe('SecurityController - getToken', () => {
    it('should delegate to service', async () => {
      const payload = { accessToken: 'token', tokenType: 'Bearer', expiresIn: 3600 };
      service.getToken.mockResolvedValue(payload);

      const result = await security.getToken();

      expect(result).toEqual(payload);
      expect(service.getToken).toHaveBeenCalled();
    });

    it('should return valid token response', async () => {
      const payload = { accessToken: 'token_abc123', tokenType: 'Bearer', expiresIn: 3600 };
      service.getToken.mockResolvedValue(payload);

      const result = await security.getToken();

      expect(result.accessToken).toBeDefined();
      expect(result.tokenType).toEqual('Bearer');
      expect(result.expiresIn).toEqual(3600);
    });

    it('should propagate service errors', async () => {
      service.getToken.mockRejectedValue(new Error('token failed'));

      await expect(security.getToken()).rejects.toThrow('token failed');
      expect(service.getToken).toHaveBeenCalled();
    });
  });
});
