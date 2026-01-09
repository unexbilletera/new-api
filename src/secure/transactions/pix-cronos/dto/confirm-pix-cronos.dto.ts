/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para confirmar transação PIX Cronos
 */
export class ConfirmPixCronosDto {
  @ApiProperty({
    description: 'ID da transação a ser confirmada',
    example: 'uuid-da-transacao',
  })
  @IsString()
  transactionId: string;
}
