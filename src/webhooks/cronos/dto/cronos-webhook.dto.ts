import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CronosWebhookDto {
  @ApiProperty({
    description: 'ID da transação no sistema Cronos',
    example: 'f6b731191dfc79bf61c96bb0f094b26f',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Valor da transação',
    example: '5',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({
    description: 'Descrição da transação',
    example: 'Recebimento de pix via chave',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Data de criação da transação',
    example: '2025-03-12 20:09:12',
  })
  @IsString()
  @IsNotEmpty()
  created_at: string;

  @ApiProperty({
    description: 'Nome do pagador',
    example: 'GRUPO SALERNO',
    required: false,
  })
  @IsString()
  @IsOptional()
  payer_name?: string;

  @ApiProperty({
    description: 'Documento do pagador (CPF/CNPJ)',
    example: '18426350000180',
    required: false,
  })
  @IsString()
  @IsOptional()
  payer_document?: string;

  @ApiProperty({
    description: 'ID do cliente no sistema Cronos (UUID)',
    example: 'b63bb55a-9821-428c-a6fe-2490740dfe9d',
    required: false,
  })
  @IsString()
  @IsOptional()
  customer_id?: string;

  @ApiProperty({
    description: 'Documento do cliente (CPF/CNPJ)',
    example: '34472503808',
    required: false,
  })
  @IsString()
  @IsOptional()
  customer_document?: string;

  @ApiProperty({
    description: 'EndToEnd ID do PIX',
    example: 'E31872495202503122308Wl7BuMKCKkC',
    required: false,
  })
  @IsString()
  @IsOptional()
  EndToEnd?: string;
}
