import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSystemConfigDto {
  @ApiProperty({ description: 'Unique configuration key' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Configuration value' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: 'Configuration description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Configuration group/category' })
  @IsString()
  @IsOptional()
  group?: string;
}

export class UpdateSystemConfigDto {
  @ApiPropertyOptional({ description: 'Configuration value' })
  @IsString()
  @IsOptional()
  value?: string;

  @ApiPropertyOptional({ description: 'Configuration description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Configuration group/category' })
  @IsString()
  @IsOptional()
  group?: string;
}

export class ListSystemConfigQueryDto {
  @ApiPropertyOptional({ description: 'Configuration group/category' })
  @IsString()
  @IsOptional()
  group?: string;

  @ApiPropertyOptional({ description: 'Search by key' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number' })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page limit' })
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
  @ApiProperty({ description: 'Module name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Whether the module is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateModuleDto {
  @ApiPropertyOptional({ description: 'Module name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Whether the module is active' })
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
