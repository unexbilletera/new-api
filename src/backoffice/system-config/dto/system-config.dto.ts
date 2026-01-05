import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSystemConfigDto {
  @ApiProperty({ description: 'Chave única da configuração' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Valor da configuração' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: 'Descrição da configuração' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Grupo/categoria da configuração' })
  @IsString()
  @IsOptional()
  group?: string;
}

export class UpdateSystemConfigDto {
  @ApiPropertyOptional({ description: 'Valor da configuração' })
  @IsString()
  @IsOptional()
  value?: string;

  @ApiPropertyOptional({ description: 'Descrição da configuração' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Grupo/categoria da configuração' })
  @IsString()
  @IsOptional()
  group?: string;
}

export class ListSystemConfigQueryDto {
  @ApiPropertyOptional({ description: 'Grupo/categoria das configurações' })
  @IsString()
  @IsOptional()
  group?: string;

  @ApiPropertyOptional({ description: 'Busca por chave' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Página' })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Limite por página' })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class SystemConfigDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  value: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}

export class CreateModuleDto {
  @ApiProperty({ description: 'Nome do módulo' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Se o módulo está ativo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateModuleDto {
  @ApiPropertyOptional({ description: 'Nome do módulo' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Se o módulo está ativo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ModuleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}
