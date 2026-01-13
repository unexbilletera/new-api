import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ActionsAppService } from '../services/actions-app.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { ActionSection, ListActionsQueryDto } from '../dto/actions-app.dto';
import {
  LayoutResponseDto,
  ActionResponseDto,
  ModuleResponseDto,
  ModuleStatusResponseDto,
  ActionsWithModuleFilterResponseDto,
} from '../dto/response';

@ApiTags('2.3 Secure - Actions')
@ApiBearerAuth('JWT-auth')
@Controller('actions')
@UseGuards(JwtAuthGuard)
export class ActionsAppController {
  constructor(private readonly actionsAppService: ActionsAppService) {}

  @Get('layout')
  @ApiOperation({
    summary: 'Get actions layout',
    description:
      'Returns the complete layout with all available actions organized in sections',
  })
  @ApiResponse({
    status: 200,
    description: 'Layout retrieved successfully',
    type: LayoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async getLayout(): Promise<LayoutResponseDto> {
    return this.actionsAppService.getFullLayout();
  }

  @Get('home')
  @ApiOperation({
    summary: 'Get home actions',
    description: 'Returns the actions available for the application home page',
  })
  @ApiResponse({
    status: 200,
    description: 'Actions retrieved successfully',
    type: [ActionResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async getHomeActions(): Promise<ActionResponseDto[]> {
    return this.actionsAppService.getHomeActions(true);
  }

  @Get('services')
  @ApiOperation({
    summary: 'Get services actions',
    description: 'Returns the actions available in the services section',
  })
  @ApiResponse({
    status: 200,
    description: 'Service actions retrieved successfully',
    type: [ActionResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async getServicesActions(): Promise<ActionResponseDto[]> {
    return this.actionsAppService.getServicesActions(true);
  }

  @Get('modules')
  @ApiOperation({
    summary: 'List available modules',
    description: 'Returns the list of all available modules in the application',
  })
  @ApiResponse({
    status: 200,
    description: 'Modules retrieved successfully',
    type: [ModuleResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async getModules(): Promise<ModuleResponseDto[]> {
    return this.actionsAppService.getModules(false);
  }

  @Get('modules/:key/enabled')
  @ApiOperation({
    summary: 'Check if module is enabled',
    description: 'Checks if a specific module is enabled for the user',
  })
  @ApiParam({
    name: 'key',
    type: String,
    description: 'Module identifier key',
  })
  @ApiResponse({
    status: 200,
    description: 'Module status retrieved successfully',
    type: ModuleStatusResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async checkModuleEnabled(
    @Param('key') moduleKey: string,
  ): Promise<ModuleStatusResponseDto> {
    const enabled = await this.actionsAppService.isModuleEnabled(moduleKey);
    return { moduleKey, enabled };
  }

  @Get('filtered')
  @ApiOperation({
    summary: 'Get filtered actions',
    description:
      'Returns actions filtered according to available permissions and modules',
  })
  @ApiResponse({
    status: 200,
    description: 'Filtered actions retrieved successfully',
    type: [ActionResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async getFilteredActions(): Promise<ActionResponseDto[]> {
    return this.actionsAppService.getActionsWithModuleFilter();
  }

  @Get('section/:section')
  @ApiOperation({
    summary: 'Get actions by section',
    description: 'Returns the actions of a specific application section',
  })
  @ApiParam({
    name: 'section',
    type: String,
    description: 'Section name (e.g.: HOME, SERVICES, TRANSFERS)',
  })
  @ApiResponse({
    status: 200,
    description: 'Section actions retrieved successfully',
    type: [ActionResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async getActionsBySection(
    @Param('section') section: ActionSection,
  ): Promise<ActionResponseDto[]> {
    return this.actionsAppService.getActionsBySection(section, true);
  }

  @Get()
  @ApiOperation({
    summary: 'Get actions (with optional filters)',
    description: 'Returns application actions, optionally filtered by section',
  })
  @ApiQuery({
    name: 'section',
    required: false,
    type: String,
    description: 'Section to filter actions',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'If true, returns only active actions',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Actions retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async getAllActions(
    @Query() query: ListActionsQueryDto,
  ): Promise<LayoutResponseDto | ActionResponseDto[]> {
    if (query.section) {
      return this.actionsAppService.getActionsBySection(
        query.section,
        query.activeOnly !== false,
      );
    }
    return this.actionsAppService.getFullLayout();
  }
}
