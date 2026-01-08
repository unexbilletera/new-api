import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActionDto {
  @ApiProperty({ description: 'Nome/código da ação' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Descrição da ação' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Grupo/módulo da ação' })
  @IsString()
  @IsOptional()
  group?: string;

  @ApiPropertyOptional({ description: 'Se a ação está ativa' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Metadados adicionais (icon, order, etc)' })
  @IsOptional()
  metadata?: { icon?: string; order?: number };
}

export class UpdateActionDto {
  @ApiPropertyOptional({ description: 'Descrição da ação' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Grupo/módulo da ação' })
  @IsString()
  @IsOptional()
  group?: string;

  @ApiPropertyOptional({ description: 'Se a ação está ativa' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ListActionsQueryDto {
  @ApiPropertyOptional({ description: 'Grupo/módulo das ações' })
  @IsString()
  @IsOptional()
  group?: string;

  @ApiPropertyOptional({ description: 'Busca por nome ou descrição' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar apenas ativas' })
  @IsBoolean()
  @IsOptional()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Página' })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Limite por página' })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class ActionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  icon: string;

  @ApiProperty()
  actionType: string;

  @ApiProperty()
  actionValue: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  enabled: boolean;

  @ApiPropertyOptional()
  moduleName?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}
