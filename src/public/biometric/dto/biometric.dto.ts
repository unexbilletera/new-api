import { IsString, IsOptional, IsIn } from 'class-validator';

export class GenerateChallengeDto {
  @IsString()
  userId: string;

  @IsString()
  deviceId: string;
}

export class VerifySignatureDto {
  @IsString()
  userId: string;

  @IsString()
  deviceId: string;

  @IsString()
  challengeId: string;

  @IsString()
  signature: string;

  @IsOptional()
  @IsString()
  @IsIn(['der', 'p1363'])
  signatureFormat?: string;
}

export class RegisterDeviceDto {
  @IsString()
  publicKeyPem: string;

  @IsString()
  @IsIn(['ES256', 'RS256'])
  keyType: string;

  @IsString()
  @IsIn(['ios', 'android', 'web'])
  platform: string;

  @IsOptional()
  @IsString()
  attestation?: string;

  @IsString()
  deviceIdentifier: string;

  @IsOptional()
  @IsString()
  @IsIn(['soft', 'hard'])
  registrationType?: string;
}

export class RegisterDeviceSoftDto {
  @IsString()
  publicKeyPem: string;

  @IsString()
  @IsIn(['ES256', 'RS256'])
  keyType: string;

  @IsString()
  @IsIn(['ios', 'android', 'web'])
  platform: string;

  @IsOptional()
  @IsString()
  attestation?: string;

  @IsString()
  deviceIdentifier: string;
}

export class SendDeviceSmsValidationDto {
  @IsString()
  deviceId: string;
}

export class VerifySmsChallengeDto {
  @IsString()
  deviceId: string;

  @IsString()
  code: string;
}

export class RevokeDeviceDto {
  @IsString()
  deviceId: string;
}
