import { IsString, IsOptional, IsObject } from 'class-validator';

export class GetUserProfileDto {
}

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsObject()
  profilePicture?: {
    url?: string;
    key?: string;
  };

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class SignoutDto {
  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class CloseAccountDto {
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class LivenessCheckDto {
  @IsOptional()
  @IsObject()
  biometricData?: any;

  @IsOptional()
  @IsString()
  videoBase64?: string;

  @IsOptional()
  @IsString()
  image?: string;
}

export class SendMessageDto {
  @IsString()
  subject: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class GetUserIdentitiesDto {
}

export class SetDefaultIdentityDto {
  @IsString()
  identityId: string;
}

export class SetDefaultAccountDto {
  @IsString()
  accountId: string;
}

export class SetUserAccountAliasDto {
  @IsString()
  accountId: string;

  @IsString()
  alias: string;
}
