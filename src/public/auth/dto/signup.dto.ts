import { IsEmail, IsString, IsPhoneNumber, IsOptional, Matches, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({
    description: 'User email address',
    example: 'usuario@exemplo.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: '123456',
  })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Password must be exactly 6 digits' })
  password: string;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Silva',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+5511987654321',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'User preferred language',
    example: 'pt',
    enum: ['es', 'pt', 'en'],
  })
  @IsString()
  @IsIn(['es', 'pt', 'en'])
  language: string;

  @ApiPropertyOptional({
    description: 'Device unique identifier',
    example: 'device-123-abc',
  })
  @IsOptional()
  @IsString()
  deviceIdentifier?: string;

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
