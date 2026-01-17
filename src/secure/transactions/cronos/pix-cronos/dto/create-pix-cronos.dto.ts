import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SpecializedValidationOptions } from '../../../../../common/validators';
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
  @Matches(
    SpecializedValidationOptions.SOURCE_ACCOUNT_ID[0],
    SpecializedValidationOptions.SOURCE_ACCOUNT_ID[1],
  )
  sourceAccountId: string;

  @ApiProperty({
    description: 'Transfer amount (minimum 0.01)',
    example: 100.5,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Recipient PIX key type',
    enum: PixKeyType,
    example: 'cpf',
  })
  @IsEnum(PixKeyType)
  targetKeyType: PixKeyType;

  @ApiProperty({
    description: 'Recipient PIX key value',
    example: '12345678900',
  })
  @IsString()
  @IsValidPixKeyFormat({
    message:
      'targetKeyValue must be a valid PIX key format for the specified type',
  })
  targetKeyValue: string;

  @ApiProperty({
    description: 'Transfer description (optional)',
    example: 'PIX transfer test',
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
