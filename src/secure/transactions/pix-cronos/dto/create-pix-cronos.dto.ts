import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';

export enum PixKeyType {
  CPF = 'cpf',
  CNPJ = 'cnpj',
  EMAIL = 'email',
  PHONE = 'phone',
  EVP = 'evp',
}

export class CreatePixCronosDto {
  @IsString()
  sourceAccountId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PixKeyType)
  targetKeyType: PixKeyType;

  @IsString()
  targetKeyValue: string;

  @IsString()
  @IsOptional()
  description?: string;
}
