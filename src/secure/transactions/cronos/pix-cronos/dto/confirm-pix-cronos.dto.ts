import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPixCronosDto {
  @ApiProperty({
    description: 'Transaction ID to be confirmed',
    example: 'uuid-da-transacao',
  })
  @IsString()
  transactionId: string;

  @ApiProperty({
    description:
      'Transactional password (4 digits) - required if user has one configured',
    example: '1234',
    minLength: 4,
    maxLength: 4,
    pattern: '^[0-9]{4}$',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'Transactional password must be exactly 4 digits',
  })
  transactionalPassword?: string;
}
