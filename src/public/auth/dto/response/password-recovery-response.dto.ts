import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Informational message',
    example: 'Recovery code sent to email',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Validation data',
    example: 'Recovery email sent successfully',
  })
  debug?: string;
}

export class VerifyPasswordResponseDto {
  @ApiProperty({
    description: 'Informational message',
    example: 'Password changed successfully',
  })
  message: string;
}

export class UnlockAccountUserDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'usuario@exemplo.com',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    nullable: true,
  })
  firstName: string | null;

  @ApiProperty({
    description: 'User last name',
    example: 'Silva',
    nullable: true,
  })
  lastName: string | null;

  @ApiProperty({
    description: 'User phone number',
    example: '+5511987654321',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: 'Account status',
    example: 'active',
  })
  status: string;

  @ApiProperty({
    description: 'User access level',
    example: 'user',
  })
  access: string;
}

export class UnlockAccountResponseDto {
  @ApiProperty({
    description: 'Authenticated user data',
    type: () => UnlockAccountUserDto,
  })
  user: UnlockAccountUserDto;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String,
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token (optional)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String,
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
    type: Number,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Informational message',
    example: 'Account unlocked successfully',
  })
  message: string;
}
