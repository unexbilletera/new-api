import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DeviceModel } from '../models/device.model';
import { BiometricMapper } from '../mappers/biometric.mapper';
import { RegisterDeviceDto, RegisterDeviceSoftDto } from '../dto/biometric.dto';

@Injectable()
export class DeviceRegistrationService {
  constructor(
    private deviceModel: DeviceModel,
    private biometricMapper: BiometricMapper,
  ) {}

  private validatePublicKey(publicKeyPem: string): boolean {
    try {
      const { createPublicKey } = require('crypto');
      createPublicKey(publicKeyPem);
      return true;
    } catch {
      return false;
    }
  }

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    const {
      publicKeyPem,
      keyType,
      platform,
      attestation,
      deviceIdentifier,
      registrationType,
    } = dto;

    if (!['ES256', 'RS256'].includes(keyType)) {
      throw new BadRequestException('auth.errors.invalidKeyType');
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      throw new BadRequestException('auth.errors.invalidPlatform');
    }

    if (!this.validatePublicKey(publicKeyPem)) {
      throw new BadRequestException('auth.errors.invalidPublicKey');
    }

    const user = await this.deviceModel.findUserById(userId);
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const type = registrationType || 'hard';
    const initialStatus = type === 'soft' ? 'active' : 'pending';

    if (type === 'soft') {
      await this.deviceModel.updateDevicesByUserStatus(
        userId,
        'active',
        'revoked',
        new Date(),
      );
    }

    const existingDevice = await this.deviceModel.findDeviceByUserAndIdentifier(
      userId,
      deviceIdentifier,
    );

    if (existingDevice) {
      if (existingDevice.status === 'active') {
        throw new BadRequestException('auth.errors.deviceAlreadyRegistered');
      }

      const updatedDevice = await this.deviceModel.updateDevice(
        existingDevice.id,
        {
          publicKeyPem,
          keyType,
          platform,
          attestation: attestation || null,
          status: initialStatus,
          revokedAt: null,
        },
      );

      return this.biometricMapper.toRegisterDeviceResponseDto(
        updatedDevice.id,
        initialStatus,
        type,
      );
    }

    const device = await this.deviceModel.createDevice({
      userId,
      deviceIdentifier,
      publicKeyPem,
      keyType,
      platform,
      attestation,
      status: initialStatus,
    });

    return this.biometricMapper.toRegisterDeviceResponseDto(
      device.id,
      initialStatus,
      type,
    );
  }

  async registerDeviceSoft(userId: string, dto: RegisterDeviceSoftDto) {
    const { publicKeyPem, keyType, platform, attestation, deviceIdentifier } =
      dto;

    if (!['ES256', 'RS256'].includes(keyType)) {
      throw new BadRequestException('auth.errors.invalidKeyType');
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      throw new BadRequestException('auth.errors.invalidPlatform');
    }

    if (!this.validatePublicKey(publicKeyPem)) {
      throw new BadRequestException('auth.errors.invalidPublicKey');
    }

    const user = await this.deviceModel.findUserById(userId);
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const existingDevice = await this.deviceModel.findDeviceByUserAndIdentifier(
      userId,
      deviceIdentifier,
    );

    if (existingDevice && existingDevice.status === 'active') {
      throw new BadRequestException('auth.errors.deviceAlreadyRegistered');
    }

    await this.deviceModel.updateDevicesByUserStatus(
      userId,
      'active',
      'revoked',
      new Date(),
    );

    const device = await this.deviceModel.createDevice({
      userId,
      deviceIdentifier,
      publicKeyPem,
      keyType,
      platform,
      attestation,
      status: 'active',
    });

    return this.biometricMapper.toRegisterDeviceSoftResponseDto(device.id);
  }
}
