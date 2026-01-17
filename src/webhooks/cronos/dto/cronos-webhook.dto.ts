import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CronosWebhookDto {
  @ApiProperty({ description: 'Transaction ID from Cronos' })
  @IsString()
  id: string;

  @ApiPropertyOptional({ description: 'Transaction type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Transaction status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Customer document (CPF/CNPJ)' })
  @IsOptional()
  @IsString()
  customer_document?: string;

  @ApiPropertyOptional({ description: 'End to End ID for PIX transactions' })
  @IsOptional()
  @IsString()
  EndToEnd?: string;

  @ApiPropertyOptional({ description: 'Sender name' })
  @IsOptional()
  @IsString()
  payer_name?: string;

  @ApiPropertyOptional({ description: 'Sender document' })
  @IsOptional()
  @IsString()
  payer_document?: string;

  @ApiPropertyOptional({ description: 'Transaction description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Transaction date' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'PIX key type' })
  @IsOptional()
  @IsString()
  key_type?: string;

  @ApiPropertyOptional({ description: 'PIX key value' })
  @IsOptional()
  @IsString()
  key_value?: string;
}
