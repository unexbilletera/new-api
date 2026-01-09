import { IsEmail, IsNotEmpty, IsString, IsOptional, MinLength, IsUUID } from 'class-validator';

export class CreateBackofficeUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  password: string;

  @IsUUID('4', { message: 'Role ID inválido' })
  @IsNotEmpty({ message: 'Role é obrigatório' })
  roleId: string;
}

export class UpdateBackofficeUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  password?: string;

  @IsUUID('4', { message: 'Role ID inválido' })
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
