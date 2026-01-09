import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPixCronosDto {
  @ApiProperty({
    description: 'Transaction ID to be confirmed',
    example: 'uuid-da-transacao',
  })
  @IsString()
  transactionId: string;
}
