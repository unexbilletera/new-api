import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
  IsUUID,
} from 'class-validator';

export class CreateBackofficeUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsEmail({}, { message: 'Invalid email' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsUUID('4', { message: 'Invalid Role ID' })
  @IsNotEmpty({ message: 'Role is required' })
  roleId: string;
}

export class UpdateBackofficeUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Invalid email' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;

  @IsUUID('4', { message: 'Invalid Role ID' })
  @IsOptional()
  roleId?: string;

  @IsString()
  @IsOptional()
  status?: 'active' | 'inactive';
}

export class BackofficeUserResponseDto {
  id: string;
  name: string;
  email: string;
  status: string;
  roleId: string;
  role?: {
    id: string;
    name: string;
    level: number;
  };
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ListBackofficeUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
