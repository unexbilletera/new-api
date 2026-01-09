import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetUserProfileDto {
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: "User's first name",
    example: 'João',
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
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: "User's profile picture",
    example: { url: 'https://exemplo.com/foto.jpg', key: 'profile/user123.jpg' },
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
  language?: string;

  @ApiPropertyOptional({
    description: "User's time zone",
    example: 'America/Sao_Paulo',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: "User's country",
    example: 'BR',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: "User's birth date",
    example: '1990-01-15',
  })
  @IsOptional()
  @IsString()
  birthdate?: string;

  @ApiPropertyOptional({
    description: "User's gender",
    example: 'masculino',
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    description: "User's marital status",
    example: 'solteiro',
  })
  @IsOptional()
  @IsString()
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
  password: string;

  @ApiPropertyOptional({
    description: 'Reason for account closure',
    example: 'Não utilizo mais o serviço',
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
  image?: string;
}

export class SendMessageDto {
  @ApiProperty({
    description: 'Message subject',
    example: 'Dúvida sobre transferência',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Gostaria de saber como fazer uma transferência internacional',
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

export class GetUserIdentitiesDto {
}

export class SetDefaultIdentityDto {
  @ApiProperty({
    description: 'Identity ID to be set as default',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  identityId: string;
}

export class SetDefaultAccountDto {
  @ApiProperty({
    description: 'Account ID to be set as default',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  accountId: string;
}

export class SetUserAccountAliasDto {
  @ApiProperty({
    description: 'Account ID to set the alias',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  accountId: string;

  @ApiProperty({
    description: 'Alias for the account',
    example: 'Conta Poupança',
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
  currentPassword: string;

  @ApiProperty({
    description: 'New account password',
    example: '654321',
  })
  @IsString()
  newPassword: string;
}

export class RequestEmailChangeDto {
  @ApiProperty({
    description: 'New email address',
    example: 'novoemail@exemplo.com',
  })
  @IsString()
  newEmail: string;
}

export class ConfirmEmailChangeDto {
  @ApiProperty({
    description: 'New email address',
    example: 'novoemail@exemplo.com',
  })
  @IsString()
  newEmail: string;

  @ApiProperty({
    description: 'Confirmation code sent to the new email',
    example: '123456',
  })
  @IsString()
  code: string;
}

export class UpdateAddressDto {
  @ApiProperty({
    description: 'Address postal code',
    example: '01310-100',
  })
  @IsString()
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
    example: 'São Paulo',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Address state',
    example: 'SP',
  })
  @IsString()
  state: string;

  @ApiPropertyOptional({
    description: 'Address complement',
    example: 'Apartamento 101',
  })
  @IsOptional()
  @IsString()
  complement?: string;
}
