import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { AuthController, SecurityController } from '../../../../src/public/auth/controllers/auth.controller';
import { AuthService } from '../../../../src/public/auth/services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let security: SecurityController;
  let service: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;

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

  it('signup delegates to service', async () => {
    const dto = {} as any;
    const payload = {
      user: { id: '1', email: 'e', firstName: 'f', lastName: 'l', phone: 'p' },
      accessToken: 't',
      expiresIn: 3600,
    };
    service.signup.mockResolvedValue(payload);
    await expect(controller.signup(dto)).resolves.toEqual(payload);
    expect(service.signup).toHaveBeenCalledWith(dto);
  });

  it('signup propagates service errors', async () => {
    const dto = { email: 'e@mail.com' } as any;
    service.signup.mockRejectedValue(new Error('signup failed'));
    await expect(controller.signup(dto)).rejects.toThrow('signup failed');
    expect(service.signup).toHaveBeenCalledWith(dto);
  });

  it('signin delegates to service', async () => {
    const dto = {} as any;
    const payload = {
      user: { id: '1', email: 'e', firstName: 'f', lastName: 'l', phone: 'p' },
      accessToken: 'a',
      refreshToken: 'r',
      expiresIn: 3600,
    };
    service.signin.mockResolvedValue(payload);
    await expect(controller.signin(dto, mockRequest as Request)).resolves.toEqual(payload);
    expect(service.signin).toHaveBeenCalledWith(dto, { ipAddress: '127.0.0.1', userAgent: 'test-agent' });
  });

  it('signin returns the service payload', async () => {
    const dto = { identifier: 'user', password: 'secret' } as any;
    const payload = {
      user: { id: '1', email: 'e', firstName: 'f', lastName: 'l', phone: 'p' },
      accessToken: 'abc',
      refreshToken: 'def',
      expiresIn: 3600,
    };
    service.signin.mockResolvedValue(payload);
    await expect(controller.signin(dto, mockRequest as Request)).resolves.toEqual(payload);
    expect(service.signin).toHaveBeenCalledWith(dto, { ipAddress: '127.0.0.1', userAgent: 'test-agent' });
  });

  it('sendEmailValidation delegates to service', async () => {
    const dto = {} as any;
    const payload = { message: 'ok', debug: '123' };
    service.sendEmailValidation.mockResolvedValue(payload);
    await expect(controller.sendEmailValidation(dto)).resolves.toEqual(payload);
    expect(service.sendEmailValidation).toHaveBeenCalledWith(dto);
  });

  it('verifyEmailCode delegates to service', async () => {
    const dto = {} as any;
    const payload = { message: 'ok', email: 'e@mail.com', nextStep: 'password' };
    service.verifyEmailCode.mockResolvedValue(payload);
    await expect(controller.verifyEmailCode(dto)).resolves.toEqual(payload);
    expect(service.verifyEmailCode).toHaveBeenCalledWith(dto);
  });

  it('verifyEmailCode propagates service errors', async () => {
    const dto = { email: 'e@mail.com', code: '123' } as any;
    service.verifyEmailCode.mockRejectedValue(new Error('invalid code'));
    await expect(controller.verifyEmailCode(dto)).rejects.toThrow('invalid code');
    expect(service.verifyEmailCode).toHaveBeenCalledWith(dto);
  });

  it('sendPhoneValidation delegates to service', async () => {
    const dto = {} as any;
    const payload = { message: 'ok', debug: '456' };
    service.sendPhoneValidation.mockResolvedValue(payload);
    await expect(controller.sendPhoneValidation(dto)).resolves.toEqual(payload);
    expect(service.sendPhoneValidation).toHaveBeenCalledWith(dto);
  });

  it('verifyPhoneCode delegates to service', async () => {
    const dto = {} as any;
    const payload = { message: 'ok', phone: '11999999999', nextStep: 'password' };
    service.verifyPhoneCode.mockResolvedValue(payload);
    await expect(controller.verifyPhoneCode(dto)).resolves.toEqual(payload);
    expect(service.verifyPhoneCode).toHaveBeenCalledWith(dto);
  });

  it('verifyPhoneCode returns service payload', async () => {
    const dto = { phone: '11999999999', code: '123' } as any;
    const payload = { message: 'ok', phone: '11999999999', nextStep: 'password' };
    service.verifyPhoneCode.mockResolvedValue(payload);
    await expect(controller.verifyPhoneCode(dto)).resolves.toEqual(payload);
    expect(service.verifyPhoneCode).toHaveBeenCalledWith(dto);
  });

  it('forgotPassword delegates to service', async () => {
    const dto = {} as any;
    const payload = { message: 'ok', debug: '111' };
    service.forgotPassword.mockResolvedValue(payload);
    await expect(controller.forgotPassword(dto)).resolves.toEqual(payload);
    expect(service.forgotPassword).toHaveBeenCalledWith(dto);
  });

  it('verify delegates to service', async () => {
    const dto = {} as any;
    const payload = { message: 'ok' };
    service.verifyPassword.mockResolvedValue(payload);
    await expect(controller.verify(dto)).resolves.toEqual(payload);
    expect(service.verifyPassword).toHaveBeenCalledWith(dto);
  });

  it('unlock delegates to service', async () => {
    const dto = {} as any;
    const payload = { message: 'ok', debug: '222' };
    service.unlockAccount.mockResolvedValue(payload);
    await expect(controller.unlock(dto)).resolves.toEqual(payload);
    expect(service.unlockAccount).toHaveBeenCalledWith(dto);
  });

  it('getToken delegates to service', async () => {
    const payload = { accessToken: 'token', tokenType: 'Bearer', expiresIn: 3600 };
    service.getToken.mockResolvedValue(payload);
    await expect(security.getToken()).resolves.toEqual(payload);
    expect(service.getToken).toHaveBeenCalled();
  });

  it('getToken propagates service errors', async () => {
    service.getToken.mockRejectedValue(new Error('token failed'));
    await expect(security.getToken()).rejects.toThrow('token failed');
    expect(service.getToken).toHaveBeenCalled();
  });
});
