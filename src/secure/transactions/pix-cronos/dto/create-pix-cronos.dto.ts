/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';

/**
 * Tipos de chave PIX suportados pela Cronos
 */
export enum PixKeyType {
  CPF = 'cpf',
  CNPJ = 'cnpj',
  EMAIL = 'email',
  PHONE = 'phone',
  EVP = 'evp', // Chave aleatória
}

/**
 * DTO para criar transação PIX Cronos
 */
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
