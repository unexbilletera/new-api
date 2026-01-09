import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmailChangeRequestResponseDto {
  @ApiProperty({
    description: 'Indicates if the request was processed successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Informational message about the process',
    example: 'Verification code sent to the new email',
  })
  message: string;

  @ApiProperty({
    description: 'New email sent for verification',
    example: 'newemail@example.com.br',
  })
  email: string;

  @ApiProperty({
    description: 'Code expiration time in seconds',
    example: 600,
  })
  expiresIn: number;

  @ApiPropertyOptional({
    description: 'Debug information (development only)',
    example: null,
  })
  debug?: any;
}

export class EmailChangeConfirmResponseDto {
  @ApiProperty({
    description: 'Indicates if the confirmation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Confirmation message',
    example: 'Email changed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Confirmed new email',
    example: 'newemail@exemplo.com.br',
  })
  email: string;
}
