import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MerchantSearchDto {
  @ApiProperty({ description: 'CUIT number to search' })
  @IsString()
  @IsNotEmpty()
  cuit: string;
}

export class CoelsaProxyDto {
  @ApiProperty({ description: 'API endpoint to call' })
  @IsString()
  @IsNotEmpty()
  api: string;

  @ApiPropertyOptional({ description: 'Request body' })
  @IsOptional()
  @IsObject()
  body?: any;
}

export class CoelsaOperationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  coelsaId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  createdAt: Date;
}

export class CoelsaMerchantDto {
  @ApiProperty()
  cuit: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  cbu?: string;

  @ApiPropertyOptional()
  alias?: string;

  @ApiPropertyOptional()
  bank?: string;
}
