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
  @ApiQuery({ name: 'search', required: false, description: 'Busca por chave' })
  @ApiQuery({ name: 'page', required: false, description: 'Page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit per page' })
  @MinLevel(1)
  async listConfigs(@Query() query: ListSystemConfigQueryDto) {
    return this.systemConfigService.listConfigs(query);
  }

  @Get('groups')
  @ApiOperation({ summary: 'List configuration groups' })
  @MinLevel(1)
  async listGroups() {
    return this.systemConfigService.listGroups();
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Get configuration by key' })
  @ApiParam({ name: 'key', description: 'Configuration key' })
  @MinLevel(1)
  async getConfigByKey(@Param('key') key: string) {
    return this.systemConfigService.getConfigByKey(key);
  }

  @Post()
  @ApiOperation({ summary: 'Create configuration' })
  @MinLevel(3)
  async createConfig(@Body() dto: CreateSystemConfigDto) {
    return this.systemConfigService.createConfig(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @MinLevel(3)
  async updateConfig(
    @Param('id') id: string,
    @Body() dto: UpdateSystemConfigDto,
  ) {
    return this.systemConfigService.updateConfig(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @MinLevel(3)
  async deleteConfig(@Param('id') id: string) {
    return this.systemConfigService.deleteConfig(id);
  }

  @Get('modules')
  @ApiOperation({ summary: 'List system modules' })
  @MinLevel(1)
  async listModules() {
    return this.systemConfigService.listModules();
  }

  @Get('modules/:id')
  @ApiOperation({ summary: 'Get module by ID' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @MinLevel(1)
  async getModule(@Param('id', ParseIntPipe) id: number) {
    return this.systemConfigService.getModule(id);
  }

  @Post('modules')
  @ApiOperation({ summary: 'Create module' })
  @MinLevel(3)
  async createModule(@Body() dto: CreateModuleDto) {
    return this.systemConfigService.createModule(dto);
  }

  @Put('modules/:id')
  @ApiOperation({ summary: 'Update module' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @MinLevel(3)
  async updateModule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.systemConfigService.updateModule(id, dto);
  }

  @Patch('modules/:id/toggle')
  @ApiOperation({ summary: 'Activate/deactivate module' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @MinLevel(2)
  async toggleModule(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.systemConfigService.toggleModule(id, isActive);
  }

  @Delete('modules/:id')
  @ApiOperation({ summary: 'Delete module' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @MinLevel(3)
  async deleteModule(@Param('id', ParseIntPipe) id: number) {
    return this.systemConfigService.deleteModule(id);
  }
}
