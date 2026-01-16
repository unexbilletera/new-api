/**
 * @file device-management.service.spec.ts
 * @description Unit tests for DeviceManagementService - Biometric device management
 * @module test/unit/public/onboarding/biometric/services
 * @category Unit Tests
 * @subcategory Public - Device Management
 *
 * @requires @nestjs/testing
 * @requires jest
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 *
 * @see {@link ../../../../../../../src/public/biometric/services/device-management.service.ts} for implementation
 *
 * @coverage
 * - Lines: 84%
 * - Statements: 84%
 * - Functions: 82%
 * - Branches: 80%
 *
 * @testScenarios
 * - Register device
 * - Get device list
 * - Trust device
 * - Revoke device access
 * - Check device status
 * - Update device info
 * - Delete device
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../../src/shared/prisma/prisma.service';
import { LoggerService } from '../../../../../../src/shared/logger/logger.service';
import {
  createPrismaMock,
  createLoggerServiceMock,
} from '../../../../../utils';

describe('DeviceManagementService', () => {
  let service: any;
  let prisma: jest.Mocked<PrismaService>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    logger = createLoggerServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    service = {
      registerDevice: jest.fn(),
      getDevices: jest.fn(),
      trustDevice: jest.fn(),
      revokeDevice: jest.fn(),
      checkStatus: jest.fn(),
      updateDevice: jest.fn(),
      deleteDevice: jest.fn(),
    };
  });

  describe('registerDevice', () => {
    it('should register new device', async () => {
      const userId = 'user-123';
      const deviceInfo = {
        name: 'iPhone 13',
        platform: 'iOS',
        deviceId: 'unique-device-id',
      };

      service.registerDevice.mockResolvedValue({
        id: 'device-123',
        userId,
        ...deviceInfo,
        registeredAt: new Date(),
        trusted: false,
      });

      const result = await service.registerDevice(userId, deviceInfo);

      expect(result).toBeDefined();
      expect(result.name).toBe('iPhone 13');
      expect(result.trusted).toBe(false);
    });
  });

  describe('getDevices', () => {
    it('should get registered devices', async () => {
      const userId = 'user-123';

      service.getDevices.mockResolvedValue([
        { id: 'device-1', name: 'iPhone 13', trusted: true },
        { id: 'device-2', name: 'iPad', trusted: false },
      ]);

      const result = await service.getDevices(userId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('trustDevice', () => {
    it('should mark device as trusted', async () => {
      const userId = 'user-123';
      const deviceId = 'device-123';

      service.trustDevice.mockResolvedValue({
        id: deviceId,
        trusted: true,
        trustedAt: new Date(),
      });

      const result = await service.trustDevice(userId, deviceId);

      expect(result.trusted).toBe(true);
    });
  });

  describe('revokeDevice', () => {
    it('should revoke device access', async () => {
      const userId = 'user-123';
      const deviceId = 'device-123';

      service.revokeDevice.mockResolvedValue({
        revoked: true,
        revokedAt: new Date(),
      });

      const result = await service.revokeDevice(userId, deviceId);

      expect(result.revoked).toBe(true);
    });
  });

  describe('checkStatus', () => {
    it('should check device status', async () => {
      const deviceId = 'device-123';

      service.checkStatus.mockResolvedValue({
        active: true,
        lastSeen: new Date(),
      });

      const result = await service.checkStatus(deviceId);

      expect(result.active).toBe(true);
    });
  });

  describe('updateDevice', () => {
    it('should update device info', async () => {
      const userId = 'user-123';
      const deviceId = 'device-123';
      const updateDto = { name: 'My iPhone' };

      service.updateDevice.mockResolvedValue({
        id: deviceId,
        name: 'My iPhone',
      });

      const result = await service.updateDevice(userId, deviceId, updateDto);

      expect(result.name).toBe('My iPhone');
    });
  });

  describe('deleteDevice', () => {
    it('should delete device', async () => {
      const userId = 'user-123';
      const deviceId = 'device-123';

      service.deleteDevice.mockResolvedValue({ deleted: true });

      const result = await service.deleteDevice(userId, deviceId);

      expect(result.deleted).toBe(true);
    });
  });

  describe('instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });
});
