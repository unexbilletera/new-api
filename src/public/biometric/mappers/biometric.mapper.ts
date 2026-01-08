import { Injectable } from '@nestjs/common';
import {
  GenerateChallengeResponseDto,
  VerifySignatureResponseDto,
  RegisterDeviceResponseDto,
  RegisterDeviceSoftResponseDto,
  SendDeviceSmsValidationResponseDto,
  VerifySmsChallengeResponseDto,
  RevokeDeviceResponseDto,
  ListDevicesResponseDto,
  CheckDeviceHealthResponseDto,
} from '../dto/response';

@Injectable()
export class BiometricMapper {
  toGenerateChallengeResponseDto(
    challengeId: string,
    challenge: string,
    expiresIn: number,
  ): GenerateChallengeResponseDto {
    return {
      challengeId,
      challenge,
      expiresIn,
    };
  }

  toVerifySignatureResponseDto(
    accessToken: string,
    expiresIn: number,
    user: any,
  ): VerifySignatureResponseDto {
    return {
      accessToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email || null,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
      },
    };
  }

  toRegisterDeviceResponseDto(
    deviceId: string,
    status: string,
    registrationType: string,
  ): RegisterDeviceResponseDto {
    return {
      deviceId,
      status: status as 'pending' | 'active',
      registrationType: registrationType as 'hard' | 'soft',
      requiresSmsValidation: registrationType === 'hard',
    };
  }

  toRegisterDeviceSoftResponseDto(deviceId: string): RegisterDeviceSoftResponseDto {
    return {
      deviceId,
      status: 'active',
      registrationType: 'soft',
      message: 'Device registered and activated successfully (SOFT)',
    };
  }

  toSendDeviceSmsValidationResponseDto(
    result: any,
  ): SendDeviceSmsValidationResponseDto {
    return {
      success: result.success,
      message: result.message,
      phone: result.phone,
      expiresIn: result.expiresIn,
      debug: result.debug,
    };
  }

  toVerifySmsChallengeResponseDto(deviceId: string): VerifySmsChallengeResponseDto {
    return {
      success: true,
      message: 'Device activated successfully',
      deviceId,
      status: 'active',
    };
  }

  toRevokeDeviceResponseDto(): RevokeDeviceResponseDto {
    return { status: 'revoked' };
  }

  toListDevicesResponseDto(devices: any[], userId: string): ListDevicesResponseDto[] {
    return devices.map((device) => ({
      deviceId: device.id,
      deviceIdentifier: device.deviceIdentifier,
      platform: device.platform,
      keyType: device.keyType,
      status: device.status,
      registeredAt: device.createdAt,
      lastUsedAt: device.lastUsedAt,
      userId,
    }));
  }

  toCheckDeviceHealthResponseDto(
    isValid: boolean,
    status: string,
    deviceId?: string,
    error?: string,
    message?: string,
    canRegister?: boolean,
  ): CheckDeviceHealthResponseDto {
    const response: CheckDeviceHealthResponseDto = {
      isValid,
      status,
    };

    if (deviceId) response.deviceId = deviceId;
    if (error) response.error = error;
    if (message) response.message = message;
    if (canRegister !== undefined) response.canRegister = canRegister;

    return response;
  }
}
