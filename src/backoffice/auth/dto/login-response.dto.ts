import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String,
  })
  accessToken: string;

  @ApiProperty({
    description: 'Authenticated user data',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Silva',
      email: 'john.silva@example.com',
      role: {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Admin',
        level: 10,
      },
    },
  })
  user: {
    id: string;
    name: string;
    email: string;
    role: {
      id: string;
      name: string;
      level: number;
    };
  };

  @ApiProperty({
    description: 'Informational message',
    example: 'Login successful',
  })
  message: string;

  @ApiProperty({
    description: 'Operation status code',
    example: 'LOGIN_SUCCESS',
  })
  code: string;
}
