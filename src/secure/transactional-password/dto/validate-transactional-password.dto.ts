import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ValidateTransactionalPasswordDto {
  @ApiProperty({
    description: 'Transactional password (4 digits)',
    example: '1234',
    minLength: 4,
    maxLength: 4,
    pattern: '^[0-9]{4}$',
  })
  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'Transactional password must be exactly 4 digits',
  })
  password: string;
}
