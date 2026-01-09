import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  targetKeyValue: string;

  @ApiProperty({
    description: 'Descrição da transferência (opcional)',
    example: 'Transferência PIX teste',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
