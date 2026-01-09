import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPixCronosDto {
  @ApiProperty({
    description: 'ID da transação a ser confirmada',
    example: 'uuid-da-transacao',
  })
  @IsString()
  transactionId: string;
}
