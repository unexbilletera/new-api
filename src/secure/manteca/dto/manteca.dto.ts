import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QrPaymentDto {
  @ApiProperty({ description: 'QR code content' })
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @ApiProperty({ description: 'Payment amount', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ description: 'Payment description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Source account ID' })
  @IsOptional()
  @IsString()
  sourceAccountId?: string;
}

export class PaymentLockDto {
  @ApiProperty({ description: 'QR code content' })
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @ApiProperty({ description: 'Lock amount', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;
}

export class RampOnDto {
  @ApiProperty({
    description: 'Amount to ramp on (Crypto -> Fiat)',
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ description: 'Target currency (BRL or ARS)' })
  @IsString()
  @IsNotEmpty()
  targetCurrency: string;

  @ApiPropertyOptional({ description: 'Target account ID' })
  @IsOptional()
  @IsString()
  targetAccountId?: string;

  @ApiPropertyOptional({ description: 'External ID for tracking' })
  @IsOptional()
  @IsString()
  externalId?: string;
}

export class RampOffDto {
  @ApiProperty({
    description: 'Amount to ramp off (Fiat -> Crypto)',
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ description: 'Source currency (BRL or ARS)' })
  @IsString()
  @IsNotEmpty()
  sourceCurrency: string;

  @ApiPropertyOptional({ description: 'Source account ID' })
  @IsOptional()
  @IsString()
  sourceAccountId?: string;

  @ApiPropertyOptional({ description: 'Crypto address to receive' })
  @IsOptional()
  @IsString()
  cryptoAddress?: string;

  @ApiPropertyOptional({ description: 'External ID for tracking' })
  @IsOptional()
  @IsString()
  externalId?: string;
}

export class WebhookDto {
  @ApiProperty({ description: 'Webhook event type' })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiProperty({ description: 'Webhook payload data' })
  @IsObject()
  data: any;

  @ApiPropertyOptional({ description: 'Webhook timestamp' })
  @IsOptional()
  @IsString()
  timestamp?: string;
}

// Response DTOs
export class QrPaymentResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  mantecaId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  message: string;
}

export class RampOperationResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  operationId: string;

  @ApiProperty()
  mantecaOperationId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  direction: string;

  @ApiProperty()
  depositAmount: number;

  @ApiProperty()
  expectedCreditAmount: number;

  @ApiPropertyOptional()
  depositAddress?: string;

  @ApiPropertyOptional()
  depositAlias?: string;

  @ApiProperty()
  message: string;
}

export class SyntheticStatusResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  mantecaId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  direction: string;

  @ApiPropertyOptional()
  stages?: any;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  confirmedAt?: Date;
}
