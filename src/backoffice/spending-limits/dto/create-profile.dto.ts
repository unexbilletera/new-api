import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LimitsConfigDto {
  @ApiPropertyOptional({ description: 'Maximum amount per transaction' })
  @IsOptional()
  @IsNumber()
  maxPerTransaction?: number;

  @ApiPropertyOptional({ description: 'Maximum daily amount' })
  @IsOptional()
  @IsNumber()
  maxDaily?: number;

  @ApiPropertyOptional({ description: 'Maximum daily transaction count' })
  @IsOptional()
  @IsNumber()
  maxCountDaily?: number;

  @ApiPropertyOptional({ description: 'Maximum monthly amount' })
  @IsOptional()
  @IsNumber()
  maxMonthly?: number;
}

export class CountryLimitsDto {
  @ApiPropertyOptional({ description: 'Transfer limits' })
  @IsOptional()
  @IsObject()
  transfer?: LimitsConfigDto;

  @ApiPropertyOptional({ description: 'QR Code limits' })
  @IsOptional()
  @IsObject()
  qrCode?: LimitsConfigDto;

  @ApiPropertyOptional({ description: 'PIX limits (Brazil only)' })
  @IsOptional()
  @IsObject()
  pix?: LimitsConfigDto;
}

export class CreateProfileDto {
  @ApiProperty({ description: 'Profile name' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiPropertyOptional({ description: 'Profile description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Is this the default profile',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Is the profile active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Daily transfer limit (legacy)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyTransferLimit?: number;

  @ApiPropertyOptional({ description: 'Daily boleto limit (legacy)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyBoletoLimit?: number;

  @ApiPropertyOptional({ description: 'Nightly transfer limit (legacy)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  nightlyTransferLimit?: number;

  @ApiPropertyOptional({ description: 'Nightly boleto limit (legacy)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  nightlyBoletoLimit?: number;

  @ApiPropertyOptional({ description: 'Nightly period start hour (0-23)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(23)
  nightlyStartHour?: number;

  @ApiPropertyOptional({ description: 'Nightly period end hour (0-23)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(23)
  nightlyEndHour?: number;

  @ApiPropertyOptional({ description: 'Argentina-specific limits (V2)' })
  @IsOptional()
  @IsObject()
  limitsAr?: CountryLimitsDto;

  @ApiPropertyOptional({ description: 'Brazil-specific limits (V2)' })
  @IsOptional()
  @IsObject()
  limitsBr?: CountryLimitsDto;
}
