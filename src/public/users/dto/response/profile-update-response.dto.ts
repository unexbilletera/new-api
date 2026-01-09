import { ApiProperty } from '@nestjs/swagger';

export class UserProfileUpdateDto {
  @ApiProperty({
    description: "User's unique identifier",
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: "User's email",
    example: 'usuario@exemplo.com.br',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    description: "User's first name",
    example: 'João',
    nullable: true,
  })
  firstName: string | null;

  @ApiProperty({
    description: "User's last name",
    example: 'Silva',
    nullable: true,
  })
  lastName: string | null;

  @ApiProperty({
    description: "User's phone number",
    example: '11999999999',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: "User's full name",
    example: 'John Silva',
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    description: "User's preferred language",
    example: 'pt-BR',
    nullable: true,
  })
  language: string | null;

  @ApiProperty({
    description: "User's residence country",
    example: 'BR',
    nullable: true,
  })
  country: string | null;

  @ApiProperty({
    description: "User's birth date",
    example: '1990-01-15',
    nullable: true,
  })
  birthdate: Date | null;

  @ApiProperty({
    description: "User's gender",
    example: 'M',
    enum: ['M', 'F', 'O'],
    nullable: true,
  })
  gender: string | null;

  @ApiProperty({
    description: "User's marital status",
    example: 'SINGLE',
    enum: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'],
    nullable: true,
  })
  maritalStatus: string | null;

  @ApiProperty({
    description: "User's profile picture URL",
    example: 'https://api.exemplo.com.br/images/user-123.jpg',
    nullable: true,
  })
  image: string | null;
}

export class ProfileUpdateResponseDto {
  @ApiProperty({
    description: 'Indicates if the profile was updated successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "Updated user's data",
    type: () => UserProfileUpdateDto,
  })
  user: UserProfileUpdateDto;
}
