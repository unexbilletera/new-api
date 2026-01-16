import { ApiProperty } from '@nestjs/swagger';

export class AccountClosureResponseDto {
  @ApiProperty({
    description: 'Indicates if the account closure was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Informational message',
    example: 'Account closure request processed successfully',
  })
  message: string;
}
