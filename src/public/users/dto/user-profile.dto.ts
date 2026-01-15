import {
  IsString,
  IsOptional,
  IsObject,
  Matches,
  IsEmail,
} from 'class-validator';
import {
  ValidationOptions,
  SpecializedValidationOptions,
} from 'src/common/validators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetUserProfileDto {}

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: "User's first name",
    example: 'John',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: "User's last name",
    example: 'Silva',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: "User's phone number",
    example: '+5511987654321',
  })
  @IsOptional()
  @Matches(...ValidationOptions.PHONE_INTERNATIONAL)
  phone?: string;

  @ApiPropertyOptional({
    description: "User's profile picture",
    example: {
      url: 'https://exemplo.com/foto.jpg',
      key: 'profile/user123.jpg',
    },
  })
  @IsOptional()
  @IsObject()
  profilePicture?: {
    url?: string;
    key?: string;
  };

  @ApiPropertyOptional({
    description: "User's preferred language",
    example: 'pt',
  })
  @IsOptional()
  @IsString()
  @Matches(...ValidationOptions.LANGUAGE)
  language?: string;

  @ApiPropertyOptional({
    description: "User's time zone",
    example: 'America/Sao_Paulo',
  })
  @IsOptional()
  @IsString()
  @Matches(...ValidationOptions.TIMEZONE)
  timezone?: string;

  @ApiPropertyOptional({
    description: "User's country",
    example: 'BR',
  })
  @IsOptional()
  @IsString()
  @Matches(...ValidationOptions.COUNTRY_CODE_2)
  country?: string;

  @ApiPropertyOptional({
    description: "User's birth date",
    example: '1990-01-15',
  })
  @IsOptional()
  @IsString()
  @Matches(...SpecializedValidationOptions.BIRTHDATE)
  birthdate?: string;

  @ApiPropertyOptional({
    description: "User's gender",
    example: 'male',
  })
  @IsOptional()
  @IsString()
  @Matches(...ValidationOptions.GENDER)
  gender?: string;

  @ApiPropertyOptional({
    description: "User's marital status",
    example: 'single',
  })
  @IsOptional()
  @IsString()
  @Matches(...ValidationOptions.MARITAL_STATUS)
  maritalStatus?: string;
}

export class SignoutDto {
  @ApiPropertyOptional({
    description: 'Device ID to logout',
    example: 'device-123-abc',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class CloseAccountDto {
  @ApiProperty({
    description: 'Account password to confirm closure',
    example: '123456',
  })
  @IsString()
  @Matches(...ValidationOptions.PASSWORD_6_DIGITS)
  password: string;

  @ApiPropertyOptional({
    description: 'Reason for account closure',
    example: 'I no longer use the service',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class LivenessCheckDto {
  @ApiPropertyOptional({
    description: 'Captured biometric data',
    example: { faceId: 'abc123', confidence: 0.95 },
  })
  @IsOptional()
  @IsObject()
  biometricData?: any;

  @ApiPropertyOptional({
    description: 'Base64 video for liveness verification',
    example: 'data:video/mp4;base64,AAAAIGZ0eXBpc29t...',
  })
  @IsOptional()
  @IsString()
  videoBase64?: string;

  @ApiPropertyOptional({
    description: 'Base64 image for liveness verification',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  @IsOptional()
  @IsString()
  @Matches(...ValidationOptions.IMAGE_DATA_URL)
  image?: string;
}

export class SendMessageDto {
  @ApiProperty({
    description: 'Message subject',
    example: 'Question about transfer',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Message content',
    example: 'I would like to know how to make an international transfer',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Message attachment URL',
    example: 'https://exemplo.com/anexo.pdf',
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class GetUserIdentitiesDto {}

export class SetDefaultIdentityDto {
  @ApiProperty({
    description: 'Identity ID to be set as default',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @Matches(...SpecializedValidationOptions.IDENTITY_ID)
  identityId: string;
}

export class SetDefaultAccountDto {
  @ApiProperty({
    description: 'Account ID to be set as default',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @Matches(...SpecializedValidationOptions.ACCOUNT_ID)
  accountId: string;
}

export class SetUserAccountAliasDto {
  @ApiProperty({
    description: 'Account ID to set the alias',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @Matches(...SpecializedValidationOptions.ACCOUNT_ID)
  accountId: string;

  @ApiProperty({
    description: 'Alias for the account',
    example: 'Savings Account',
  })
  @IsString()
  alias: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current account password',
    example: '123456',
  })
  @IsString()
  @Matches(...SpecializedValidationOptions.CURRENT_PASSWORD)
  currentPassword: string;

  @ApiProperty({
    description: 'New account password',
    example: '654321',
  })
  @IsString()
  @Matches(...SpecializedValidationOptions.NEW_PASSWORD)
  newPassword: string;
}

export class RequestEmailChangeDto {
  @ApiProperty({
    description: 'New email address',
    example: 'novoemail@exemplo.com',
  })
  @IsEmail({}, { message: 'New email must be a valid email address' })
  newEmail: string;
}

export class ConfirmEmailChangeDto {
  @ApiProperty({
    description: 'New email address',
    example: 'novoemail@exemplo.com',
  })
  @IsEmail({}, { message: 'New email must be a valid email address' })
  newEmail: string;

  @ApiProperty({
    description: 'Confirmation code sent to the new email',
    example: '123456',
  })
  @IsString()
  @Matches(...ValidationOptions.CODE_6_DIGITS)
  code: string;
}

export class UpdateAddressDto {
  @ApiProperty({
    description: 'Address postal code',
    example: '01310-100',
  })
  @IsString()
  @Matches(...ValidationOptions.ZIP_CODE_BR)
  zipCode: string;

  @ApiProperty({
    description: 'Street name',
    example: 'Avenida Paulista',
  })
  @IsString()
  street: string;

  @ApiProperty({
    description: 'Address number',
    example: '1578',
  })
  @IsString()
  number: string;

  @ApiPropertyOptional({
    description: 'Address neighborhood',
    example: 'Bela Vista',
  })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiProperty({
    description: 'Address city',
    example: 'Sao Paulo',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Address state',
    example: 'SP',
  })
  @IsString()
  @Matches(...ValidationOptions.STATE_CODE_2)
  state: string;

  @ApiPropertyOptional({
    description: 'Address complement',
    example: 'Apartamento 101',
  })
  @IsOptional()
  @IsString()
  complement?: string;
}
