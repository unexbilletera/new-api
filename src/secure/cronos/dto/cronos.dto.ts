import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SetUserPixDto {
  @ApiProperty({ description: 'PIX key type (cpf, cnpj, phone, email, evp)' })
  @IsString()
  @IsNotEmpty()
  keyType: string;

  @ApiProperty({ description: 'PIX key value' })
  @IsString()
  @IsNotEmpty()
  keyValue: string;
}

export class RemoveUserPixDto {
  @ApiProperty({ description: 'PIX key type to remove' })
  @IsString()
  @IsNotEmpty()
  keyType: string;
}

export class PaymentModesDto {
  @ApiProperty({ description: 'Company ID' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiPropertyOptional({ description: 'Barcode or bill reference' })
  @IsOptional()
  @IsString()
  barcode?: string;
}

export class SendTransactionalTokenDto {
  @ApiPropertyOptional({ description: 'User document (CPF)' })
  @IsOptional()
  @IsString()
  document?: string;
}

export class CronosProxyDto {
  @ApiProperty({ description: 'API endpoint to call' })
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @ApiProperty({ description: 'HTTP method' })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiPropertyOptional({ description: 'Request body' })
  @IsOptional()
  @IsObject()
  body?: any;

  @ApiPropertyOptional({ description: 'Query parameters' })
  @IsOptional()
  @IsObject()
  params?: any;
}

export class RechargeCompanyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  logo?: string;

  @ApiProperty()
  category?: string;
}

export class PixKeyResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  keyType: string;

  @ApiProperty()
  keyValue: string;

  @ApiProperty()
  message: string;
}
