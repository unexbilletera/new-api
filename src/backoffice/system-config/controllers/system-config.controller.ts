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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BackofficeAuthGuard } from '../../../shared/guards/backoffice-auth.guard';
import { BackofficeRoleGuard, MinLevel } from '../../../shared/guards/backoffice-role.guard';
import { SystemConfigService } from '../services/system-config.service';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
  ListSystemConfigQueryDto,
  CreateModuleDto,
  UpdateModuleDto,
} from '../dto/system-config.dto';

@ApiTags('Backoffice - System Config')
@ApiBearerAuth()
@UseGuards(BackofficeAuthGuard, BackofficeRoleGuard)
@Controller('backoffice/system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Listar configurações do sistema' })
  @ApiQuery({ name: 'group', required: false, description: 'Grupo das configurações' })
  @ApiQuery({ name: 'search', required: false, description: 'Busca por chave' })
  @ApiQuery({ name: 'page', required: false, description: 'Página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite por página' })
  @MinLevel(1)
  async listConfigs(@Query() query: ListSystemConfigQueryDto) {
    return this.systemConfigService.listConfigs(query);
  }

  @Get('groups')
  @ApiOperation({ summary: 'Listar grupos de configuração' })
  @MinLevel(1)
  async listGroups() {
    return this.systemConfigService.listGroups();
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Obter configuração por chave' })
  @ApiParam({ name: 'key', description: 'Chave da configuração' })
  @MinLevel(1)
  async getConfigByKey(@Param('key') key: string) {
    return this.systemConfigService.getConfigByKey(key);
  }

  @Post()
  @ApiOperation({ summary: 'Criar configuração' })
  @MinLevel(3)
  async createConfig(@Body() dto: CreateSystemConfigDto) {
    return this.systemConfigService.createConfig(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar configuração' })
  @ApiParam({ name: 'id', description: 'ID da configuração' })
  @MinLevel(3)
  async updateConfig(@Param('id') id: string, @Body() dto: UpdateSystemConfigDto) {
    return this.systemConfigService.updateConfig(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar configuração' })
  @ApiParam({ name: 'id', description: 'ID da configuração' })
  @MinLevel(3)
  async deleteConfig(@Param('id') id: string) {
    return this.systemConfigService.deleteConfig(id);
  }

  @Get('modules')
  @ApiOperation({ summary: 'Listar módulos do sistema' })
  @MinLevel(1)
  async listModules() {
    return this.systemConfigService.listModules();
  }

  @Get('modules/:id')
  @ApiOperation({ summary: 'Obter módulo por ID' })
  @ApiParam({ name: 'id', description: 'ID do módulo' })
  @MinLevel(1)
  async getModule(@Param('id', ParseIntPipe) id: number) {
    return this.systemConfigService.getModule(id);
  }

  @Post('modules')
  @ApiOperation({ summary: 'Criar módulo' })
  @MinLevel(3)
  async createModule(@Body() dto: CreateModuleDto) {
    return this.systemConfigService.createModule(dto);
  }

  @Put('modules/:id')
  @ApiOperation({ summary: 'Atualizar módulo' })
  @ApiParam({ name: 'id', description: 'ID do módulo' })
  @MinLevel(3)
  async updateModule(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateModuleDto) {
    return this.systemConfigService.updateModule(id, dto);
  }

  @Patch('modules/:id/toggle')
  @ApiOperation({ summary: 'Ativar/desativar módulo' })
  @ApiParam({ name: 'id', description: 'ID do módulo' })
  @MinLevel(2)
  async toggleModule(@Param('id', ParseIntPipe) id: number, @Body('isActive') isActive: boolean) {
    return this.systemConfigService.toggleModule(id, isActive);
  }

  @Delete('modules/:id')
  @ApiOperation({ summary: 'Deletar módulo' })
  @ApiParam({ name: 'id', description: 'ID do módulo' })
  @MinLevel(3)
  async deleteModule(@Param('id', ParseIntPipe) id: number) {
    return this.systemConfigService.deleteModule(id);
  }
}
