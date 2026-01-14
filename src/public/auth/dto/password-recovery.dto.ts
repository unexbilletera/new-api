import {
  IsEmail,
  IsString,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @Matches(/^\d{6}$/, {
    message: 'Code must be exactly 6 digits',
  })
  code: string;

  @ApiProperty({
    description: 'User password',
    example: '654321',
  })
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'Password must be exactly 6 digits',
  })
  newPassword: string;
}

export class UnlockAccountDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, {
    message: 'users.errors.invalidId',
  })
  id: string;

  @ApiProperty({
    description: 'User password',
    example: '123456',
  })
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'Password must be exactly 6 digits',
  })
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
