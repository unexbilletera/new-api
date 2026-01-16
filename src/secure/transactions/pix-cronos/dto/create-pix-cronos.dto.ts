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
  @Matches(...SpecializedValidationOptions.SOURCE_ACCOUNT_ID)
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
  targetKeyValue: string;

  @ApiProperty({
    description: 'Transfer description (optional)',
    example: 'PIX transfer test',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
