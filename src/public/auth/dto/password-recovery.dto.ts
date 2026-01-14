import { IsEmail, IsString, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ValidationOptions,
  SpecializedValidationOptions,
} from 'src/common/validators';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'User email address',
    example: 'usuario@exemplo.com',
  })
  @IsEmail()
  email: string;
}

export class VerifyPasswordDto {
  @ApiProperty({
    description: 'User email address',
    example: 'usuario@exemplo.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Verification code sent for email validation',
    example: '123456',
  })
  @IsString()
  @Matches(...ValidationOptions.CODE_6_DIGITS)
  code: string;

  @ApiProperty({
    description: 'User password',
    example: '654321',
  })
  @IsString()
  @Matches(...SpecializedValidationOptions.NEW_PASSWORD)
  newPassword: string;
}

export class UnlockAccountDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @Matches(...ValidationOptions.UUID)
  id: string;

  @ApiProperty({
    description: 'User password',
    example: '123456',
  })
  @IsString()
  @Matches(...ValidationOptions.PASSWORD_6_DIGITS)
  password: string;

  @ApiPropertyOptional({
    description: 'Operating system version of the device',
    example: 'iOS 15.0',
  })
  @IsOptional()
  @IsString()
  systemVersion?: string;

  @ApiPropertyOptional({
    description: 'Mobile device information',
    example: { model: 'iPhone 12', os: 'iOS 15.0' },
  })
  @IsOptional()
  mobileDevice?: any;

  @ApiPropertyOptional({
    description: 'Web browser information',
    example: { name: 'Chrome', version: '96.0' },
  })
  @IsOptional()
  browser?: any;
}
