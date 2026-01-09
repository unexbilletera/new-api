import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BiometricController } from '../../../../src/public/biometric/controllers/biometric.controller';
import { DeviceRegistrationService } from '../../../../src/public/biometric/services/device-registration.service';
import { ChallengeVerificationService } from '../../../../src/public/biometric/services/challenge-verification.service';
import { DeviceManagementService } from '../../../../src/public/biometric/services/device-management.service';
import { JwtAuthGuard } from '../../../../src/shared/guards/jwt-auth.guard';

describe('BiometricController', () => {
  let controller: BiometricController;
  let deviceRegistrationService: jest.Mocked<DeviceRegistrationService>;
  let challengeVerificationService: jest.Mocked<ChallengeVerificationService>;
  let deviceManagementService: jest.Mocked<DeviceManagementService>;

  const mockUserId = 'user-123';
  const mockDeviceId = 'device-456';
  const mockChallengeId = 'challenge-789';

  beforeEach(async () => {
    deviceRegistrationService = {
      registerDevice: jest.fn(),
      registerDeviceSoft: jest.fn(),
    } as unknown as jest.Mocked<DeviceRegistrationService>;

    challengeVerificationService = {
      generateChallenge: jest.fn(),
      verifySignature: jest.fn(),
      verifySmsAndActivate: jest.fn(),
    } as unknown as jest.Mocked<ChallengeVerificationService>;

    deviceManagementService = {
      sendDeviceSmsValidation: jest.fn(),
      revokeDevice: jest.fn(),
      listUserDevices: jest.fn(),
      checkDeviceHealth: jest.fn(),
    } as unknown as jest.Mocked<DeviceManagementService>;

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      decode: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    const mockAuthGuard: CanActivate = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BiometricController],
      providers: [
        { provide: DeviceRegistrationService, useValue: deviceRegistrationService },
        { provide: ChallengeVerificationService, useValue: challengeVerificationService },
        { provide: DeviceManagementService, useValue: deviceManagementService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: JwtAuthGuard, useValue: mockAuthGuard },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get(BiometricController);
  });

  describe('challenge generation and verification', () => {
    it('generateChallenge should delegate to service', async () => {
      const dto = { userId: mockUserId, deviceId: mockDeviceId } as any;
      const payload = { challengeId: mockChallengeId, challenge: 'challenge_data', expiresIn: 180 };
      challengeVerificationService.generateChallenge.mockResolvedValue(payload);

      const result = await controller.generateChallenge(mockUserId, dto);

      expect(result).toEqual(payload);
      expect(challengeVerificationService.generateChallenge).toHaveBeenCalledWith(dto);
    });

    it('generateChallenge should include challenge expiration time', async () => {
      const dto = { userId: mockUserId, deviceId: mockDeviceId } as any;
      const payload = { challengeId: mockChallengeId, challenge: 'challenge_data', expiresIn: 180 };
      challengeVerificationService.generateChallenge.mockResolvedValue(payload);

      const result = await controller.generateChallenge(mockUserId, dto);

      expect(result.expiresIn).toEqual(180);
      expect(result.challenge).toBeDefined();
    });

    it('generateChallenge should propagate service errors', async () => {
      const dto = { userId: mockUserId, deviceId: mockDeviceId } as any;
      challengeVerificationService.generateChallenge.mockRejectedValue(new Error('Challenge generation failed'));

      await expect(controller.generateChallenge(mockUserId, dto)).rejects.toThrow('Challenge generation failed');
    });

    it('verifySignature should delegate to service', async () => {
      const dto = { userId: mockUserId, deviceId: mockDeviceId, challengeId: mockChallengeId, signature: 'signature_data' } as any;
      const payload = {
        accessToken: 'jwt_token',
        expiresIn: 3600,
        user: { id: mockUserId, email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
      };
      challengeVerificationService.verifySignature.mockResolvedValue(payload);

      const result = await controller.verifySignature(mockUserId, dto);

      expect(result).toEqual(payload);
      expect(challengeVerificationService.verifySignature).toHaveBeenCalledWith(dto);
    });

    it('verifySignature should return user data and access token', async () => {
      const dto = { userId: mockUserId, deviceId: mockDeviceId, challengeId: mockChallengeId, signature: 'signature_data' } as any;
      const payload = {
        accessToken: 'jwt_token_123',
        expiresIn: 3600,
        user: { id: mockUserId, email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
      };
      challengeVerificationService.verifySignature.mockResolvedValue(payload);

      const result = await controller.verifySignature(mockUserId, dto);

      expect(result.accessToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toEqual(mockUserId);
    });

    it('verifySignature should propagate service errors', async () => {
      const dto = { userId: mockUserId, deviceId: mockDeviceId, challengeId: mockChallengeId, signature: 'invalid' } as any;
      challengeVerificationService.verifySignature.mockRejectedValue(new Error('Invalid signature'));

      await expect(controller.verifySignature(mockUserId, dto)).rejects.toThrow('Invalid signature');
    });
  });

  describe('device registration', () => {
    it('registerDevice should delegate to service with user context', async () => {
      const dto = { publicKeyPem: 'pem_key', keyType: 'ES256', platform: 'ios', deviceIdentifier: 'device-id' } as any;
      const payload = { deviceId: mockDeviceId, status: 'pending' as const, registrationType: 'hard' as const, requiresSmsValidation: true };
      deviceRegistrationService.registerDevice.mockResolvedValue(payload);

      const result = await controller.registerDevice(mockUserId, dto);

      expect(result).toEqual(payload);
      expect(deviceRegistrationService.registerDevice).toHaveBeenCalledWith(mockUserId, dto);
    });

    it('registerDevice should return device with pending status', async () => {
      const dto = { publicKeyPem: 'pem_key', keyType: 'ES256', platform: 'ios', deviceIdentifier: 'device-id' } as any;
      const payload = { deviceId: mockDeviceId, status: 'pending' as const, registrationType: 'hard' as const, requiresSmsValidation: true };
      deviceRegistrationService.registerDevice.mockResolvedValue(payload);

      const result = await controller.registerDevice(mockUserId, dto);

      expect(result.status).toEqual('pending');
      expect(result.registrationType).toEqual('hard');
      expect(result.requiresSmsValidation).toBe(true);
    });

    it('registerDeviceSoft should delegate to service', async () => {
      const dto = { publicKeyPem: 'pem_key', keyType: 'ES256', platform: 'ios', deviceIdentifier: 'device-id' } as any;
      const payload = {
        deviceId: mockDeviceId,
        status: 'active' as const,
        registrationType: 'soft' as const,
        message: 'Device registered and activated successfully (SOFT)',
      };
      deviceRegistrationService.registerDeviceSoft.mockResolvedValue(payload);

      const result = await controller.registerDeviceSoft(mockUserId, dto);

      expect(result).toEqual(payload);
      expect(deviceRegistrationService.registerDeviceSoft).toHaveBeenCalledWith(mockUserId, dto);
    });

    it('registerDeviceSoft should return device with active status', async () => {
      const dto = { publicKeyPem: 'pem_key', keyType: 'ES256', platform: 'ios', deviceIdentifier: 'device-id' } as any;
      const payload = {
        deviceId: mockDeviceId,
        status: 'active' as const,
        registrationType: 'soft' as const,
        message: 'Device registered and activated successfully (SOFT)',
      };
      deviceRegistrationService.registerDeviceSoft.mockResolvedValue(payload);

      const result = await controller.registerDeviceSoft(mockUserId, dto);

      expect(result.status).toEqual('active');
      expect(result.registrationType).toEqual('soft');
    });
  });

  describe('SMS validation', () => {
    it('sendDeviceSmsValidation should delegate to service', async () => {
      const dto = { deviceId: mockDeviceId } as any;
      const payload = { success: true, message: 'SMS validation code sent', phone: '+5511999999999', expiresIn: 300 };
      deviceManagementService.sendDeviceSmsValidation.mockResolvedValue(payload);

      const result = await controller.sendDeviceSmsValidation(mockUserId, dto);

      expect(result).toEqual(payload);
      expect(deviceManagementService.sendDeviceSmsValidation).toHaveBeenCalledWith(mockUserId, dto);
    });

    it('sendDeviceSmsValidation should return expiration time', async () => {
      const dto = { deviceId: mockDeviceId } as any;
      const payload = { success: true, message: 'SMS validation code sent', phone: '+5511999999999', expiresIn: 300 };
      deviceManagementService.sendDeviceSmsValidation.mockResolvedValue(payload);

      const result = await controller.sendDeviceSmsValidation(mockUserId, dto);

      expect(result.expiresIn).toEqual(300);
      expect(result.phone).toBeDefined();
    });

    it('verifySmsAndActivate should delegate to service', async () => {
      const dto = { deviceId: mockDeviceId, code: '123456' } as any;
      const payload = { success: true, message: 'Device activated successfully', deviceId: mockDeviceId, status: 'active' as const };
      challengeVerificationService.verifySmsAndActivate.mockResolvedValue(payload);

      const result = await controller.verifySmsAndActivate(mockUserId, dto);

      expect(result).toEqual(payload);
      expect(challengeVerificationService.verifySmsAndActivate).toHaveBeenCalledWith(mockUserId, dto);
    });

    it('verifySmsAndActivate should return active device', async () => {
      const dto = { deviceId: mockDeviceId, code: '123456' } as any;
      const payload = { success: true, message: 'Device activated successfully', deviceId: mockDeviceId, status: 'active' as const };
      challengeVerificationService.verifySmsAndActivate.mockResolvedValue(payload);

      const result = await controller.verifySmsAndActivate(mockUserId, dto);

      expect(result.status).toEqual('active');
      expect(result.success).toBe(true);
    });

    it('verifySmsAndActivate should propagate service errors', async () => {
      const dto = { deviceId: mockDeviceId, code: 'invalid' } as any;
      challengeVerificationService.verifySmsAndActivate.mockRejectedValue(new Error('Invalid code'));

      await expect(controller.verifySmsAndActivate(mockUserId, dto)).rejects.toThrow('Invalid code');
    });
  });

  describe('device management', () => {
    it('revokeDevice should delegate to service', async () => {
      const dto = { deviceId: mockDeviceId } as any;
      const payload = { status: 'revoked' as const, message: 'Device revoked successfully' };
      deviceManagementService.revokeDevice.mockResolvedValue(payload);

      const result = await controller.revokeDevice(mockUserId, dto);

      expect(result).toEqual(payload);
      expect(deviceManagementService.revokeDevice).toHaveBeenCalledWith(mockUserId, dto);
    });

    it('revokeDevice should return revoked status', async () => {
      const dto = { deviceId: mockDeviceId } as any;
      const payload = { status: 'revoked' as const, message: 'Device revoked successfully' };
      deviceManagementService.revokeDevice.mockResolvedValue(payload);

      const result = await controller.revokeDevice(mockUserId, dto);

      expect(result.status).toEqual('revoked');
    });

    it('listDevices should delegate to service', async () => {
      const payload = [
        {
          deviceId: mockDeviceId,
          deviceIdentifier: 'device-identifier',
          platform: 'ios',
          keyType: 'ES256',
          status: 'active' as const,
          registeredAt: new Date(),
          lastUsedAt: new Date(),
          userId: mockUserId,
        },
      ];
      deviceManagementService.listUserDevices.mockResolvedValue(payload);

      const result = await controller.listDevices(mockUserId, mockUserId);

      expect(result).toEqual(payload);
      expect(deviceManagementService.listUserDevices).toHaveBeenCalledWith(mockUserId);
    });

    it('listDevices should return array of devices', async () => {
      const payload = [
        {
          deviceId: mockDeviceId,
          deviceIdentifier: 'device-identifier',
          platform: 'ios',
          keyType: 'ES256',
          status: 'active' as const,
          registeredAt: new Date(),
          lastUsedAt: new Date(),
          userId: mockUserId,
        },
        {
          deviceId: 'device-789',
          deviceIdentifier: 'device-identifier-2',
          platform: 'android',
          keyType: 'ES256',
          status: 'revoked' as const,
          registeredAt: new Date(),
          lastUsedAt: null,
          userId: mockUserId,
        },
      ];
      deviceManagementService.listUserDevices.mockResolvedValue(payload);

      const result = await controller.listDevices(mockUserId, mockUserId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toEqual(2);
    });

    it('listDevices should propagate service errors', async () => {
      deviceManagementService.listUserDevices.mockRejectedValue(new Error('Failed to list devices'));

      await expect(controller.listDevices(mockUserId, mockUserId)).rejects.toThrow('Failed to list devices');
    });
  });

  describe('device health check', () => {
    it('healthCheck should delegate to service', async () => {
      const deviceIdentifier = 'device-identifier';
      const payload = { isValid: true, status: 'active' as const, deviceId: mockDeviceId };
      deviceManagementService.checkDeviceHealth.mockResolvedValue(payload);

      const result = await controller.healthCheck(mockUserId, mockUserId, deviceIdentifier);

      expect(result).toEqual(payload);
      expect(deviceManagementService.checkDeviceHealth).toHaveBeenCalledWith(mockUserId, deviceIdentifier);
    });

    it('healthCheck should return device validity status', async () => {
      const deviceIdentifier = 'device-identifier';
      const payload = { isValid: true, status: 'active' as const, deviceId: mockDeviceId };
      deviceManagementService.checkDeviceHealth.mockResolvedValue(payload);

      const result = await controller.healthCheck(mockUserId, mockUserId, deviceIdentifier);

      expect(result.isValid).toBe(true);
      expect(result.status).toEqual('active');
    });

    it('healthCheck should handle invalid devices', async () => {
      const deviceIdentifier = 'invalid-device';
      const payload = { isValid: false, status: 'revoked' as const, deviceId: undefined };
      deviceManagementService.checkDeviceHealth.mockResolvedValue(payload);

      const result = await controller.healthCheck(mockUserId, mockUserId, deviceIdentifier);

      expect(result.isValid).toBe(false);
    });

    it('healthCheck should propagate service errors', async () => {
      const deviceIdentifier = 'device-identifier';
      deviceManagementService.checkDeviceHealth.mockRejectedValue(new Error('Health check failed'));

      await expect(controller.healthCheck(mockUserId, mockUserId, deviceIdentifier)).rejects.toThrow('Health check failed');
    });
  });
});
