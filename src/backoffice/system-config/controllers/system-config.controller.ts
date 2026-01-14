import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BackofficeAuthGuard } from '../../../shared/guards/backoffice-auth.guard';
import {
  BackofficeRoleGuard,
  MinLevel,
} from '../../../shared/guards/backoffice-role.guard';
import { SystemConfigService } from '../services/system-config.service';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
  ListSystemConfigQueryDto,
  CreateModuleDto,
  UpdateModuleDto,
} from '../dto/system-config.dto';

@ApiTags('3.3 Backoffice - System Config')
@ApiBearerAuth()
@UseGuards(BackofficeAuthGuard, BackofficeRoleGuard)
@Controller('backoffice/system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  @ApiOperation({ summary: 'List system configurations' })
  @ApiQuery({
    name: 'group',
    required: false,
    description: 'Configuration group',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search by key' })
  @ApiQuery({ name: 'page', required: false, description: 'Page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit per page' })
  @ApiResponse({
    status: 200,
    description: 'Configurations listed successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @MinLevel(1)
  async listConfigs(@Query() query: ListSystemConfigQueryDto): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.systemConfigService.listConfigs(query);
  }

  @Get('groups')
  @ApiOperation({ summary: 'List configuration groups' })
  @ApiResponse({
    status: 200,
    description: 'Groups listed successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @MinLevel(1)
  async listGroups(): Promise<string[]> {
    return this.systemConfigService.listGroups();
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Get configuration by key' })
  @ApiParam({ name: 'key', description: 'Configuration key' })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        key: { type: 'string' },
        value: { type: 'string' },
        group: { type: 'string' },
        description: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  @MinLevel(1)
  async getConfigByKey(@Param('key') key: string): Promise<any> {
    return this.systemConfigService.getConfigByKey(key);
  }

  @Post()
  @ApiOperation({ summary: 'Create configuration' })
  @ApiResponse({
    status: 201,
    description: 'Configuration created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        key: { type: 'string' },
        value: { type: 'string' },
        group: { type: 'string' },
        description: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or configuration already exists',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @MinLevel(3)
  async createConfig(@Body() dto: CreateSystemConfigDto): Promise<any> {
    return this.systemConfigService.createConfig(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        key: { type: 'string' },
        value: { type: 'string' },
        group: { type: 'string' },
        description: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  @MinLevel(3)
  async updateConfig(
    @Param('id') id: string,
    @Body() dto: UpdateSystemConfigDto,
  ): Promise<any> {
    return this.systemConfigService.updateConfig(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({
    status: 200,
    description: 'Configuration deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  @MinLevel(3)
  async deleteConfig(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.systemConfigService.deleteConfig(id);
  }

  @Get('modules')
  @ApiOperation({ summary: 'List system modules' })
  @ApiResponse({
    status: 200,
    description: 'Modules listed successfully',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @MinLevel(1)
  async listModules(): Promise<any[]> {
    return this.systemConfigService.listModules();
  }

  @Get('modules/:id')
  @ApiOperation({ summary: 'Get module by ID' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiResponse({
    status: 200,
    description: 'Module retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        description: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Module not found' })
  @MinLevel(1)
  async getModule(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.systemConfigService.getModule(id);
  }

  @Post('modules')
  @ApiOperation({ summary: 'Create module' })
  @ApiResponse({
    status: 201,
    description: 'Module created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        description: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or module already exists',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @MinLevel(3)
  async createModule(@Body() dto: CreateModuleDto): Promise<any> {
    return this.systemConfigService.createModule(dto);
  }

  @Put('modules/:id')
  @ApiOperation({ summary: 'Update module' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiResponse({
    status: 200,
    description: 'Module updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        description: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Module not found' })
  @MinLevel(3)
  async updateModule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModuleDto,
  ): Promise<any> {
    return this.systemConfigService.updateModule(id, dto);
  }

  @Patch('modules/:id/toggle')
  @ApiOperation({ summary: 'Activate/deactivate module' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiResponse({
    status: 200,
    description: 'Module status toggled successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Module not found' })
  @MinLevel(2)
  async toggleModule(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ): Promise<{ success: boolean; message: string }> {
    return this.systemConfigService.toggleModule(id, isActive);
  }

  @Delete('modules/:id')
  @ApiOperation({ summary: 'Delete module' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiResponse({
    status: 200,
    description: 'Module deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Module not found' })
  @MinLevel(3)
  async deleteModule(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; message: string }> {
    return this.systemConfigService.deleteModule(id);
  }
}
