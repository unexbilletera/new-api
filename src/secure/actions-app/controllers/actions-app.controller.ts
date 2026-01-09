import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActionsAppService } from '../services/actions-app.service';
import { AuthGuard } from '../../../shared/guards/auth.guard';
import { ActionSection, ListActionsQueryDto } from '../dto/actions-app.dto';
import {
  LayoutResponseDto,
  ActionResponseDto,
  ModuleResponseDto,
  ModuleStatusResponseDto,
  ActionsWithModuleFilterResponseDto,
} from '../dto/response';

@Controller('actions')
@UseGuards(AuthGuard)
export class ActionsAppController {
  constructor(private readonly actionsAppService: ActionsAppService) {}

  @Get('layout')
  async getLayout(): Promise<LayoutResponseDto> {
    return this.actionsAppService.getFullLayout();
  }

  @Get('home')
  async getHomeActions(): Promise<ActionResponseDto[]> {
    return this.actionsAppService.getHomeActions(true);
  }

  @Get('services')
  async getServicesActions(): Promise<ActionResponseDto[]> {
    return this.actionsAppService.getServicesActions(true);
  }

  @Get('modules')
  async getModules(): Promise<ModuleResponseDto[]> {
    return this.actionsAppService.getModules(false);
  }

  @Get('modules/:key/enabled')
  async checkModuleEnabled(@Param('key') moduleKey: string): Promise<ModuleStatusResponseDto> {
    const enabled = await this.actionsAppService.isModuleEnabled(moduleKey);
    return { moduleKey, enabled };
  }

  @Get('filtered')
  async getFilteredActions(): Promise<ActionResponseDto[]> {
    return this.actionsAppService.getActionsWithModuleFilter();
  }

  @Get('section/:section')
  async getActionsBySection(@Param('section') section: ActionSection): Promise<ActionResponseDto[]> {
    return this.actionsAppService.getActionsBySection(section, true);
  }

  @Get()
  async getAllActions(@Query() query: ListActionsQueryDto): Promise<LayoutResponseDto | ActionResponseDto[]> {
    if (query.section) {
      return this.actionsAppService.getActionsBySection(
        query.section,
        query.activeOnly !== false,
      );
    }
    return this.actionsAppService.getFullLayout();
  }
}
