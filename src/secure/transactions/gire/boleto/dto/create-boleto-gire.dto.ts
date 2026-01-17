import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class CreateBoletoGireDto {
  @ApiProperty({
    description: 'Código de barras do boleto',
    example: '1820734384043000000000145001',
  })
  @IsString()
  barcode: string;

  @ApiProperty({
    description: 'Valor do boleto (quando aplicável)',
    example: 145.0,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;
}
