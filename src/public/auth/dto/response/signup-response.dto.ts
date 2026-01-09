import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignupUserDto {
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
}

export class SignupResponseDto {
  @ApiPropertyOptional({
    description: 'Success indicator',
    example: true,
  })
  deviceRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Device type',
    example: 'mobile',
  })
  deviceType?: string;

  @ApiPropertyOptional({
    description: 'Informational message',
    example: 'Cadastro realizado successfully',
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'User unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId?: string;

  @ApiProperty({
    description: 'Authenticated user data',
    type: () => SignupUserDto,
  })
  user: SignupUserDto;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String,
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
    type: Number,
  })
  expiresIn: number;
}

export class SignupDeviceRequiredResponseDto {
  @ApiProperty({
    description: 'Success indicator',
    example: true,
  })
  deviceRequired: boolean;

  @ApiProperty({
    description: 'Device type',
    example: 'mobile',
  })
  deviceType: string;

  @ApiProperty({
    description: 'Informational message',
    example: 'It is necessary to register a device to continue',
  })
  message: string;

  @ApiProperty({
    description: 'User unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId: string;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String,
  })
  accessToken: string;

  @ApiProperty({
    description: 'Authenticated user data',
    type: () => SignupUserDto,
  })
  user: SignupUserDto;
}
