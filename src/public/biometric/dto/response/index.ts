export class GenerateChallengeResponseDto {
  challengeId: string;
  challenge: string;
  expiresIn: number;
}

export class VerifySignatureResponseDto {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
}

export class RegisterDeviceResponseDto {
  deviceId: string;
  status: 'pending' | 'active';
  registrationType: 'hard' | 'soft';
  requiresSmsValidation: boolean;
}

export class RegisterDeviceSoftResponseDto {
  deviceId: string;
  status: 'active';
  registrationType: 'soft';
  message: string;
}

export class SendDeviceSmsValidationResponseDto {
  success: boolean;
  message: string;
  phone: string;
  expiresIn: number;
  debug?: string;
}

export class VerifySmsChallengeResponseDto {
  success: boolean;
  message: string;
  deviceId: string;
  status: 'active';
}

export class RevokeDeviceResponseDto {
  status: 'revoked';
}

export class ListDevicesResponseDto {
  deviceId: string;
  deviceIdentifier: string;
  platform: string;
  keyType: string;
  status: 'pending' | 'active' | 'revoked';
  registeredAt: Date;
  lastUsedAt: Date | null;
  userId: string;
}

export class CheckDeviceHealthResponseDto {
  isValid: boolean;
  status: string;
  deviceId?: string;
  error?: string;
  message?: string;
  canRegister?: boolean;
}
