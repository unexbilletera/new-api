import { ApiProperty } from '@nestjs/swagger';

/**
 * Role information for current user
 */
export class CurrentUserRoleDto {
  @ApiProperty({
    description: 'Role unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Role name',
    example: 'admin',
  })
  name: string;

  @ApiProperty({
    description: 'Role level (higher = more permissions)',
    example: 10,
  })
  level: number;
}

/**
 * Current authenticated user payload
 * Used across all controllers for @CurrentUser() decorator
 */
export class CurrentUserPayloadDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Role ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  roleId: string;

  @ApiProperty({
    description: 'Role details',
    type: CurrentUserRoleDto,
  })
  role: CurrentUserRoleDto;
}
