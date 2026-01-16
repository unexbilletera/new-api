import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsObject,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TransactionType {
  CASHIN = 'cashin',
  CASHOUT = 'cashout',
  CASHOUT_GIRE = 'cashout_gire',
  CASHIN_COELSA = 'cashin_coelsa',
  CASHOUT_COELSA = 'cashout_coelsa',
  REFOUND_COELSA = 'refound_coelsa',
  CASHOUT_CRONOS_QR = 'cashout_cronos_qr',
  TRANSFER = 'transfer',
  CASHBACK = 'cashback',
  PAYMENT = 'payment',
  PAYMENT_QR = 'payment_qr',
  PAYMENT_GIRE = 'payment_gire',
  PAYMENT_CRONOS = 'payment_cronos',
  RECHARGE_GIRE = 'recharge_gire',
  RECHARGE_CRONOS = 'recharge_cronos',
  CASHOUT_MANTECA_QR_AR = 'cashout_manteca_qr_ar',
  CASHOUT_MANTECA_QR_BR = 'cashout_manteca_qr_br',
  CASHOUT_MANTECA_EXCHANGE_AR = 'cashout_manteca_exchange_ar',
  CASHOUT_MANTECA_EXCHANGE_BR = 'cashout_manteca_exchange_br',
}

export class CreateTransactionBaseDto {
  @ApiProperty({ description: 'Source account ID' })
  @IsString()
  @IsNotEmpty()
  sourceAccountId: string;

  @ApiProperty({ description: 'Transaction amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Transaction description/reason' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Additional reference data' })
  @IsOptional()
  @IsObject()
  reference?: any;
}

export class CreateCashinDto extends CreateTransactionBaseDto {
  @ApiPropertyOptional({ description: 'Source name' })
  @IsOptional()
  @IsString()
  sourceName?: string;
}

export class CreateCashoutDto extends CreateTransactionBaseDto {
  @ApiProperty({ description: 'Target account ID or external identifier' })
  @IsString()
  @IsNotEmpty()
  targetAccountId: string;

  @ApiPropertyOptional({ description: 'Target name' })
  @IsOptional()
  @IsString()
  targetName?: string;

  @ApiPropertyOptional({ description: 'Target CVU/CBU (Argentina)' })
  @IsOptional()
  @IsString()
  targetCvu?: string;
}

export class CreateTransferDto extends CreateTransactionBaseDto {
  @ApiProperty({
    description:
      'Target type (pix_cpf, pix_phone, pix_email, pix_evp, cvu, cbu)',
  })
  @IsString()
  @IsNotEmpty()
  targetType: string;

  @ApiProperty({ description: 'Target value (PIX key, CVU, CBU, etc)' })
  @IsString()
  @IsNotEmpty()
  target: string;

  @ApiPropertyOptional({ description: 'Target name' })
  @IsOptional()
  @IsString()
  targetName?: string;

  @ApiPropertyOptional({ description: 'Account type override (cronos, bind)' })
  @IsOptional()
  @IsString()
  accountType?: string;
}

export class CreatePaymentDto extends CreateTransactionBaseDto {
  @ApiProperty({ description: 'Barcode or payment code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Payment type (barcode, qr)' })
  @IsOptional()
  @IsString()
  paymentType?: string;

  @ApiPropertyOptional({ description: 'Bill data from provider' })
  @IsOptional()
  @IsObject()
  billData?: any;
}

export class CreatePaymentQrDto extends CreateTransactionBaseDto {
  @ApiProperty({ description: 'QR code content' })
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @ApiPropertyOptional({ description: 'Against currency (ARS, BRL)' })
  @IsOptional()
  @IsString()
  against?: string;

  @ApiPropertyOptional({ description: 'QR data decoded' })
  @IsOptional()
  @IsObject()
  qrData?: any;
}

export class CreateRechargeDto extends CreateTransactionBaseDto {
  @ApiProperty({ description: 'Company code' })
  @IsString()
  @IsNotEmpty()
  companyCode: string;

  @ApiProperty({ description: 'Phone number or account to recharge' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Company name' })
  @IsOptional()
  @IsString()
  companyName?: string;
}

export class CreateMantecaExchangeDto extends CreateTransactionBaseDto {
  @ApiProperty({ description: 'Rate code for the exchange' })
  @IsString()
  @IsNotEmpty()
  rateCode: string;

  @ApiPropertyOptional({ description: 'Converted amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  convertedAmount?: number;

  @ApiPropertyOptional({ description: 'Exchange rate used' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rate?: number;
}

export class CreateCoelsaDto extends CreateTransactionBaseDto {
  @ApiPropertyOptional({ description: 'Target CVU' })
  @IsOptional()
  @IsString()
  targetCvu?: string;

  @ApiPropertyOptional({ description: 'Target CUIT' })
  @IsOptional()
  @IsString()
  targetCuit?: string;

  @ApiPropertyOptional({ description: 'Target name' })
  @IsOptional()
  @IsString()
  targetName?: string;

  @ApiPropertyOptional({ description: 'Coelsa operation ID' })
  @IsOptional()
  @IsString()
  coelsaId?: string;
}

export class ConfirmTransactionDto {
  @ApiProperty({ description: 'Transaction ID to confirm' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiPropertyOptional({ description: 'Additional confirmation data' })
  @IsOptional()
  @IsObject()
  data?: any;
}

export class CancelTransactionDto {
  @ApiProperty({ description: 'Transaction ID to cancel' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class TicketTransactionQueryDto {
  @ApiPropertyOptional({
    description: 'Content type (pdf, html)',
    default: 'html',
  })
  @IsOptional()
  @IsString()
  contentType?: string;
}
