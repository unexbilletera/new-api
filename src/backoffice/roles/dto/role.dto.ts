import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1, { message: 'Nível mínimo é 1' })
  @Max(10, { message: 'Nível máximo é 10' })
  level: number;
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'Nível mínimo é 1' })
  @Max(10, { message: 'Nível máximo é 10' })
  level?: number;
}

export class RoleResponseDto {
  id: string;
  name: string;
  description?: string | null;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}
