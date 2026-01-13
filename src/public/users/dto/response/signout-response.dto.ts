import { ApiProperty } from '@nestjs/swagger';

export class SignoutResponseDto {
  @ApiProperty({
    description: 'Indicates if the logout was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Informational message',
    example: 'Logged out successfully',
  })
  message: string;
}
