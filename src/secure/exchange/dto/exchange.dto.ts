import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ConvertDto {
  @ApiProperty({ description: 'Source currency (BRL or ARS)' })
  @IsString()
  @IsNotEmpty()
  fromCurrency: string;

  @ApiProperty({ description: 'Target currency (ARS or BRL)' })
  @IsString()
  @IsNotEmpty()
  toCurrency: string;

  @ApiProperty({ description: 'Amount to convert', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({
    description: 'Operation type',
    enum: ['buy', 'sell'],
  })
  @IsOptional()
  @IsEnum(['buy', 'sell'])
  operation?: 'buy' | 'sell';
}

export class BulkRatesDto {
  @ApiProperty({ description: 'Array of amounts to calculate', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  amounts: number[];

  @ApiProperty({ description: 'Source currency (BRL or ARS)' })
  @IsString()
  @IsNotEmpty()
  fromCurrency: string;

  @ApiProperty({ description: 'Target currency (ARS or BRL)' })
  @IsString()
  @IsNotEmpty()
  toCurrency: string;
}

export class PreviewDto {
  @ApiProperty({ description: 'Source currency (BRL or ARS)' })
  @IsString()
  @IsNotEmpty()
  fromCurrency: string;

  @ApiProperty({ description: 'Target currency (ARS or BRL)' })
  @IsString()
  @IsNotEmpty()
  toCurrency: string;

  @ApiProperty({ description: 'Amount to exchange', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({
    description: 'Operation type',
    enum: ['buy', 'sell'],
  })
  @IsOptional()
  @IsEnum(['buy', 'sell'])
  operation?: 'buy' | 'sell';
}

export class ConfirmDto {
  @ApiProperty({ description: 'Rate code from preview' })
  @IsString()
  @IsNotEmpty()
  rateCode: string;

  @ApiPropertyOptional({ description: 'Source account ID' })
  @IsOptional()
  @IsString()
  sourceAccountId?: string;

  @ApiPropertyOptional({ description: 'Target account ID' })
  @IsOptional()
  @IsString()
  targetAccountId?: string;
}

export class ExchangeRatesResponseDto {
  @ApiProperty()
  brl_ars_buy: number;

  @ApiProperty()
  brl_ars_sell: number;

  @ApiProperty()
  ars_brl_buy: number;

  @ApiProperty()
  ars_brl_sell: number;

  @ApiProperty()
  commission_rate_buy: number;

  @ApiProperty()
  commission_rate_sell: number;

  @ApiProperty()
  timestamp: number;
}

export class ConvertResponseDto {
  @ApiProperty()
  fromCurrency: string;

  @ApiProperty()
  toCurrency: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  rate: number;

  @ApiProperty()
  convertedAmount: number;

  @ApiProperty()
  commissionRate: number;

  @ApiProperty()
  commissionAmount: number;

  @ApiProperty()
  totalDebit: number;

  @ApiProperty()
  operation: string;
}

export class PreviewResponseDto extends ConvertResponseDto {
  @ApiProperty()
  rateCode: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  expiresInSeconds: number;
}

export class ConfirmResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  details: {
    fromCurrency: string;
    toCurrency: string;
    amount: number;
    rate: number;
    convertedAmount: number;
    totalDebit: number;
  };
}
