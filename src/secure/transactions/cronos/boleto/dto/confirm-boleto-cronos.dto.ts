import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmBoletoCronosDto {
  @ApiProperty({
    description: 'ID da transação pendente',
    example: 'uuid-da-transacao',
  })
  @IsString()
  transactionId: string;
}
