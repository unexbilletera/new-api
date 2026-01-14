import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class UpdateTransactionalPasswordDto {
  @ApiProperty({
    description: 'Current transactional password (4 digits)',
    example: '1234',
    minLength: 4,
    maxLength: 4,
    pattern: '^[0-9]{4}$',
  })
  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'Current transactional password must be exactly 4 digits',
  })
  currentPassword: string;

  @ApiProperty({
    description: 'New transactional password (4 digits)',
    example: '5678',
    minLength: 4,
    maxLength: 4,
    pattern: '^[0-9]{4}$',
  })
  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'New transactional password must be exactly 4 digits',
  })
  newPassword: string;
}
