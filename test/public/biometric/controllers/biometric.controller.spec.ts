import { Test, TestingModule } from '@nestjs/testing';
import { BiometricController } from '../../../../src/public/biometric/controllers/biometric.controller';
import { BiometricService } from '../../../../src/public/biometric/services/biometric.service';

describe('BiometricController', () => {
  let controller: BiometricController;
  let service: jest.Mocked<BiometricService>;

  beforeEach(async () => {
    service = {
      generateChallenge: jest.fn(),
      verifySignature: jest.fn(),
      registerDevice: jest.fn(),
      registerDeviceSoft: jest.fn(),
      sendDeviceSmsValidation: jest.fn(),
      verifySmsAndActivate: jest.fn(),
      revokeDevice: jest.fn(),
      listUserDevices: jest.fn(),
      checkDeviceHealth: jest.fn(),
    } as unknown as jest.Mocked<BiometricService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BiometricController],
      providers: [{ provide: BiometricService, useValue: service }],
    }).compile();

    controller = module.get(BiometricController);
  });

  it('generateChallenge delegates to service', async () => {
    const dto = { userId: 'u1', deviceId: 'd1' };
    const payload = { challengeId: 'c1', challenge: 'abc', expiresIn: 180 };
    service.generateChallenge.mockResolvedValue(payload);
    await expect(controller.generateChallenge(dto)).resolves.toEqual(payload);
    expect(service.generateChallenge).toHaveBeenCalledWith(dto);
  });

  it('verifySignature delegates to service', async () => {
    const dto = { userId: 'u1', deviceId: 'd1', challengeId: 'c1', signature: 'sig' };
    const payload = { accessToken: 'jwt', expiresIn: 3600, user: { id: 'u1', email: 'test@test.com', firstName: 'Test', lastName: 'User' } };
    service.verifySignature.mockResolvedValue(payload);
    await expect(controller.verifySignature(dto)).resolves.toEqual(payload);
    expect(service.verifySignature).toHaveBeenCalledWith(dto);
  });

  it('registerDevice delegates to service', async () => {
    const dto = { userId: 'u1', publicKeyPem: 'pem', keyType: 'ES256', platform: 'ios', deviceIdentifier: 'd1' };
    const payload = { deviceId: 'd1', status: 'pending', registrationType: 'hard', requiresSmsValidation: true };
    service.registerDevice.mockResolvedValue(payload);
    await expect(controller.registerDevice(dto as any)).resolves.toEqual(payload);
    expect(service.registerDevice).toHaveBeenCalledWith('u1', dto);
  });

  it('registerDeviceSoft delegates to service', async () => {
    const dto = { userId: 'u1', publicKeyPem: 'pem', keyType: 'ES256', platform: 'ios', deviceIdentifier: 'd1' };
    const payload = { deviceId: 'd1', status: 'active', registrationType: 'soft', message: 'Device registered and activated successfully (SOFT)' };
    service.registerDeviceSoft.mockResolvedValue(payload);
    await expect(controller.registerDeviceSoft(dto as any)).resolves.toEqual(payload);
    expect(service.registerDeviceSoft).toHaveBeenCalledWith('u1', dto);
  });

  it('sendDeviceSmsValidation delegates to service', async () => {
    const dto = { userId: 'u1', deviceId: 'd1' };
    const payload = { success: true, message: 'SMS validation code sent', phone: '123', expiresIn: 300, debug: undefined };
    service.sendDeviceSmsValidation.mockResolvedValue(payload);
    await expect(controller.sendDeviceSmsValidation(dto as any)).resolves.toEqual(payload);
    expect(service.sendDeviceSmsValidation).toHaveBeenCalledWith('u1', dto);
  });

  it('verifySmsAndActivate delegates to service', async () => {
    const dto = { userId: 'u1', deviceId: 'd1', code: '123456' };
    const payload = { success: true, message: 'Device activated successfully', deviceId: 'd1', status: 'active' };
    service.verifySmsAndActivate.mockResolvedValue(payload);
    await expect(controller.verifySmsAndActivate(dto as any)).resolves.toEqual(payload);
    expect(service.verifySmsAndActivate).toHaveBeenCalledWith('u1', dto);
  });

  it('revokeDevice delegates to service', async () => {
    const dto = { userId: 'u1', deviceId: 'd1' };
    const payload = { status: 'revoked' };
    service.revokeDevice.mockResolvedValue(payload);
    await expect(controller.revokeDevice(dto as any)).resolves.toEqual(payload);
    expect(service.revokeDevice).toHaveBeenCalledWith('u1', dto);
  });

  it('listDevices delegates to service', async () => {
    const payload = [{ deviceId: 'd1', deviceIdentifier: 'di1', platform: 'ios', keyType: 'ES256', status: 'active', registeredAt: new Date(), lastUsedAt: null, userId: 'uid' }];
    service.listUserDevices.mockResolvedValue(payload);
    await expect(controller.listDevices('uid')).resolves.toEqual(payload);
    expect(service.listUserDevices).toHaveBeenCalledWith('uid');
  });

  it('healthCheck delegates to service', async () => {
    const payload = { isValid: true, status: 'active', deviceId: 'd1' };
    service.checkDeviceHealth.mockResolvedValue(payload);
    await expect(controller.healthCheck('u1', 'di1')).resolves.toEqual(payload);
    expect(service.checkDeviceHealth).toHaveBeenCalledWith('u1', 'di1');
  });
});
