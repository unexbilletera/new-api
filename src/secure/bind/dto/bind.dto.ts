import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TransactionFiltersDto {
  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Transaction status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class BindProxyDto {
  @ApiProperty({ description: 'Request body' })
  @IsObject()
  @IsNotEmpty()
  body: any;
}

// Response DTOs
export class BindAccountDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  cvu: string;

  @ApiPropertyOptional()
  alias?: string;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  currency: string;
}

export class BindTransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bindId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  date: Date;

  @ApiPropertyOptional()
  description?: string;
}

export class BindTransferDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bindId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  sourceCvu: string;

  @ApiProperty()
  targetCvu: string;

  @ApiProperty()
  createdAt: Date;
}
