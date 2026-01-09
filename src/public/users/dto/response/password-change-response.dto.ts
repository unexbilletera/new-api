import { ApiProperty } from '@nestjs/swagger';

export class PasswordChangeResponseDto {
  @ApiProperty({
    description: 'Indicates if the password was changed successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Message confirming the password change',
    example: 'Password changed successfully',
  })
  message: string;
}
