import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBoletoCronosDto {
  @ApiProperty({
    description: 'ID da conta de origem',
    example: 'uuid-da-conta-origem',
  })
  @IsString()
  sourceAccountId: string;

  @ApiProperty({
    description: 'Código de barras do boleto',
    example: '1820734384043000000000145001',
  })
  @IsString()
  barcode: string;

  @ApiProperty({
    description: 'Valor do boleto (quando aplicável)',
    example: 145.0,
    required: false,
  })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @ApiProperty({
    description: 'Descrição do pagamento (opcional)',
    example: 'Pagamento de boleto via Cronos',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description:
      'Chave de idempotência para evitar transações duplicadas (opcional)',
    example: 'unique-idempotency-key-456',
    required: false,
  })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
