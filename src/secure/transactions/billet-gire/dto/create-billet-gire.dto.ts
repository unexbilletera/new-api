import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBilletGireDto {
  @ApiProperty({ description: 'Source account ID' })
  @IsString()
  @IsNotEmpty()
  sourceAccountId: string;

  @ApiProperty({ description: 'Billet barcode (47 or 48 digits)' })
  @IsString()
  @IsNotEmpty()
  barcode: string;

  @ApiPropertyOptional({ description: 'Payment amount (if different from billet value)' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ description: 'Payment description' })
  @IsOptional()
  @IsString()
  description?: string;
}
