import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DeviceModel } from '../models/device.model';
import { BiometricMapper } from '../mappers/biometric.mapper';
import { SmsService } from '../../../shared/sms/sms.service';
import { SendDeviceSmsValidationDto, RevokeDeviceDto } from '../dto/biometric.dto';

@Injectable()
export class DeviceManagementService {
  constructor(
    private deviceModel: DeviceModel,
    private biometricMapper: BiometricMapper,
    private smsService: SmsService,
  ) {}

  async sendDeviceSmsValidation(userId: string, dto: SendDeviceSmsValidationDto) {
    const { deviceId } = dto;

    const user = await this.deviceModel.findUserById(userId);
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const device = await this.deviceModel.findPendingDevice(deviceId, userId);
    if (!device) {
      throw new NotFoundException('auth.errors.deviceNotFoundOrNotPending');
    }

    if (!user.phone) {
      throw new BadRequestException('users.errors.phoneRequired');
    }

    const result = await this.smsService.sendValidationCode(
      user.phone,
      6,
      5,
      'sms',
      user.language || undefined,
    );

    return this.biometricMapper.toSendDeviceSmsValidationResponseDto(result);
  }

  async revokeDevice(userId: string, dto: RevokeDeviceDto) {
    const { deviceId } = dto;

    const user = await this.deviceModel.findUserById(userId);
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const device = await this.deviceModel.findDeviceByIdAndUser(deviceId, userId);
    if (!device || !['pending', 'active'].includes(device.status)) {
      throw new NotFoundException('auth.errors.deviceNotFound');
    }

    await this.deviceModel.updateDevice(device.id, {
      status: 'revoked',
      revokedAt: new Date(),
    });

    await this.deviceModel.invalidateChallengesByDevice(device.id);

    return this.biometricMapper.toRevokeDeviceResponseDto();
  }

  async listUserDevices(userId: string) {
    const user = await this.deviceModel.findUserById(userId);
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const devices = await this.deviceModel.findActiveDevicesByUser(userId);

    return this.biometricMapper.toListDevicesResponseDto(devices, userId);
  }

  async checkDeviceHealth(userId: string, deviceIdentifier: string) {
    const activeDevice = await this.deviceModel.findActiveDeviceByUserAndIdentifier(userId, deviceIdentifier);

    if (activeDevice) {
      await this.deviceModel.updateDevice(activeDevice.id, { lastUsedAt: new Date() });

      return this.biometricMapper.toCheckDeviceHealthResponseDto(
        true,
        'active',
        activeDevice.id,
      );
    }

    const device = await this.deviceModel.findDeviceByUserAndIdentifier(userId, deviceIdentifier);

    if (device && (device.status === 'revoked' || device.revokedAt)) {
      return this.biometricMapper.toCheckDeviceHealthResponseDto(
        false,
        'revoked',
        device.id,
        'auth.errors.deviceRevoked',
        'Sua conta foi acessada em outro dispositivo.',
        true,
      );
    }

    return this.biometricMapper.toCheckDeviceHealthResponseDto(
      false,
      'not_found',
      undefined,
      'auth.errors.deviceNotFound',
      'Device not found or not active. Device registration required.',
    );
  }
}
