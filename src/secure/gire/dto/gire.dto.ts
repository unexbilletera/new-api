import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetBillsDto {
  @ApiPropertyOptional({ description: 'Bill reference 1' })
  @IsOptional()
  @IsString()
  reference1?: string;

  @ApiPropertyOptional({ description: 'Bill reference 2' })
  @IsOptional()
  @IsString()
  reference2?: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsOptional()
  @IsString()
  companyId?: string;
}

export class CompanySearchDto {
  @ApiProperty({ description: 'Company name to search' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class GireCompanyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional()
  logo?: string;

  @ApiPropertyOptional()
  category?: string;
}

export class GireBillDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  dueDate: string;

  @ApiProperty()
  barcode: string;

  @ApiPropertyOptional()
  description?: string;
}

export class GireOperationDto {
  @ApiProperty()
  operationId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiPropertyOptional()
  ticket?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  confirmedAt?: Date;
}
