import { IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ValidationOptions,
  SpecializedValidationOptions,
} from '../../../common/validators';

export class SigninDto {
  @ApiProperty({
    description: 'User email or CPF',
    example: 'usuario@exemplo.com.br',
  })
  @IsString()
  identifier: string;

  @ApiProperty({
    description: 'User password',
    example: 'SenhaSegura123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'Operating system version of the device',
    example: '14.5',
  })
  @IsOptional()
  @IsString()
  @Matches(...ValidationOptions.VERSION)
  systemVersion?: string;

  @ApiPropertyOptional({
    description: 'Device unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  @Matches(...SpecializedValidationOptions.DEVICE_IDENTIFIER)
  deviceIdentifier?: string;

  @ApiPropertyOptional({
    description: 'Mobile device information',
    example: { model: 'iPhone 12', version: '15.0' },
  })
  @IsOptional()
  mobileDevice?: any;

  @ApiPropertyOptional({
    description: 'Web browser information',
    example: { name: 'Chrome', version: '120.0' },
  })
  @IsOptional()
  browser?: any;
}
