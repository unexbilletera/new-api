import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmBilletCronosDto {
  @ApiProperty({ description: 'Transaction ID to confirm' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ description: 'Transactional password' })
  @IsString()
  @IsNotEmpty()
  transactionalPassword: string;
}
