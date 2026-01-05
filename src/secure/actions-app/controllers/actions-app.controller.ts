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

@Controller('actions')
@UseGuards(AuthGuard)
export class ActionsAppController {
  constructor(private readonly actionsAppService: ActionsAppService) {}  @Get('layout')
  async getLayout() {
    return this.actionsAppService.getFullLayout();
  }  @Get('home')
  async getHomeActions() {
    return this.actionsAppService.getHomeActions(true);
  }  @Get('services')
  async getServicesActions() {
    return this.actionsAppService.getServicesActions(true);
  }  @Get('modules')
  async getModules() {
    return this.actionsAppService.getModules(false);
  }  @Get('modules/:key/enabled')
  async checkModuleEnabled(@Param('key') moduleKey: string) {
    const enabled = await this.actionsAppService.isModuleEnabled(moduleKey);
    return { moduleKey, enabled };
  }  @Get('filtered')
  async getFilteredActions() {
    return this.actionsAppService.getActionsWithModuleFilter();
  }  @Get('section/:section')
  async getActionsBySection(@Param('section') section: ActionSection) {
    return this.actionsAppService.getActionsBySection(section, true);
  }  @Get()
  async getAllActions(@Query() query: ListActionsQueryDto) {
    if (query.section) {
      return this.actionsAppService.getActionsBySection(
        query.section,
        query.activeOnly !== false,
      );
    }
    return this.actionsAppService.getFullLayout();
  }
}
