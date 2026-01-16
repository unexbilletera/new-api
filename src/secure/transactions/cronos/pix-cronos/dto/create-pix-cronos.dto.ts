import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidPixKeyFormat } from '../validators/pix-key-format.validator';

export enum PixKeyType {
  CPF = 'cpf',
  CNPJ = 'cnpj',
  EMAIL = 'email',
  PHONE = 'phone',
  EVP = 'evp',
}

export class CreatePixCronosDto {
  @ApiProperty({
    description: 'ID da conta de origem',
    example: 'uuid-da-conta-origem',
  })
  @IsString()
  sourceAccountId: string;

  @ApiProperty({
    description: 'Valor da transferência (mínimo 0.01)',
    example: 100.5,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Tipo da chave PIX do destinatário',
    enum: PixKeyType,
    example: 'cpf',
  })
  @IsEnum(PixKeyType)
  targetKeyType: PixKeyType;

  @ApiProperty({
    description: 'Valor da chave PIX do destinatário',
    example: '12345678900',
  })
  @IsString()
  @IsValidPixKeyFormat({
    message:
      'targetKeyValue must be a valid PIX key format for the specified type',
  })
  targetKeyValue: string;

  @ApiProperty({
    description: 'Descrição da transferência (opcional)',
    example: 'Transferência PIX teste',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description:
      'Chave de idempotência para evitar transações duplicadas (opcional)',
    example: 'unique-idempotency-key-123',
    required: false,
  })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
