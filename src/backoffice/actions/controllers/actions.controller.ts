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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BackofficeAuthGuard } from '../../../shared/guards/backoffice-auth.guard';
import { BackofficeRoleGuard, MinLevel } from '../../../shared/guards/backoffice-role.guard';
import { ActionsService } from '../services/actions.service';
import {
  CreateActionDto,
  UpdateActionDto,
  ListActionsQueryDto,
} from '../dto/actions.dto';

@ApiTags('Backoffice - Actions')
@ApiBearerAuth()
@UseGuards(BackofficeAuthGuard, BackofficeRoleGuard)
@Controller('backoffice/actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ações/serviços disponíveis' })
  @ApiQuery({ name: 'group', required: false, description: 'Grupo/módulo das ações' })
  @ApiQuery({ name: 'search', required: false, description: 'Busca por nome ou descrição' })
  @ApiQuery({ name: 'activeOnly', required: false, description: 'Apenas ações ativas' })
  @ApiQuery({ name: 'page', required: false, description: 'Página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite por página' })
  @MinLevel(1)
  async listActions(@Query() query: ListActionsQueryDto) {
    return this.actionsService.listActions(query);
  }

  @Get('groups')
  @ApiOperation({ summary: 'Listar grupos/módulos de ações' })
  @MinLevel(1)
  async listGroups() {
    return this.actionsService.listGroups();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter ação por ID' })
  @ApiParam({ name: 'id', description: 'ID da ação' })
  @MinLevel(1)
  async getAction(@Param('id') id: string) {
    return this.actionsService.getAction(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar ação' })
  @MinLevel(3)
  async createAction(@Body() dto: CreateActionDto) {
    return this.actionsService.createAction(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar ação' })
  @ApiParam({ name: 'id', description: 'ID da ação' })
  @MinLevel(3)
  async updateAction(@Param('id') id: string, @Body() dto: UpdateActionDto) {
    return this.actionsService.updateAction(id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Ativar/desativar ação' })
  @ApiParam({ name: 'id', description: 'ID da ação' })
  @MinLevel(2)
  async toggleAction(@Param('id') id: string, @Body('enabled') enabled: boolean) {
    return this.actionsService.toggleAction(id, enabled);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar ação' })
  @ApiParam({ name: 'id', description: 'ID da ação' })
  @MinLevel(3)
  async deleteAction(@Param('id') id: string) {
    return this.actionsService.deleteAction(id);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reordenar ações' })
  @MinLevel(2)
  async reorderActions(@Body() actions: { id: string; order: number }[]) {
    return this.actionsService.reorderActions(actions);
  }

  @Get('check/:userId/:actionName')
  @ApiOperation({ summary: 'Verificar se usuário pode executar ação' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiParam({ name: 'actionName', description: 'Nome da ação' })
  @MinLevel(1)
  async userCanPerformAction(
    @Param('userId') userId: string,
    @Param('actionName') actionName: string,
  ) {
    const canPerform = await this.actionsService.userCanPerformAction(userId, actionName);
    return { userId, actionName, canPerform };
  }
}
