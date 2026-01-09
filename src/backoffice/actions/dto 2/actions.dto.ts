import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActionDto {
  @ApiProperty({ description: 'Action name/code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Action description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Action group/module' })
  @IsString()
  @IsOptional()
  group?: string;

  @ApiPropertyOptional({ description: 'Whether the action is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata (icon, order, etc)' })
  @IsOptional()
  metadata?: { icon?: string; order?: number };
}

export class UpdateActionDto {
  @ApiPropertyOptional({ description: 'Action description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Action group/module' })
  @IsString()
  @IsOptional()
  group?: string;

  @ApiPropertyOptional({ description: 'Whether the action is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ListActionsQueryDto {
  @ApiPropertyOptional({ description: 'Action group/module' })
  @IsString()
  @IsOptional()
  group?: string;

  @ApiPropertyOptional({ description: 'Search by name or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter only active actions' })
  @IsBoolean()
  @IsOptional()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Page number' })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page limit' })
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
