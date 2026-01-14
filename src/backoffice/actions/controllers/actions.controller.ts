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
import { ActionsService } from '../services/actions.service';
import {
  CreateActionDto,
  UpdateActionDto,
  ListActionsQueryDto,
} from '../dto/actions.dto';

@ApiTags('3.3 Backoffice - Actions')
@ApiBearerAuth()
@UseGuards(BackofficeAuthGuard, BackofficeRoleGuard)
@Controller('backoffice/actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Get()
  @ApiOperation({ summary: 'List available actions/services' })
  @ApiQuery({
    name: 'group',
    required: false,
    description: 'Action group/module',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or description',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    description: 'Active actions only',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit per page' })
  @ApiResponse({
    status: 200,
    description: 'Actions listed successfully',
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
  async listActions(@Query() query: ListActionsQueryDto): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.actionsService.listActions(query);
  }

  @Get('groups')
  @ApiOperation({ summary: 'List action groups/modules' })
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
    return this.actionsService.listGroups();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get action by ID' })
  @ApiParam({ name: 'id', description: 'Action ID' })
  @ApiResponse({
    status: 200,
    description: 'Action retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        group: { type: 'string' },
        enabled: { type: 'boolean' },
        order: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Action not found' })
  @MinLevel(1)
  async getAction(@Param('id') id: string): Promise<any> {
    return this.actionsService.getAction(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create action' })
  @ApiResponse({
    status: 201,
    description: 'Action created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        group: { type: 'string' },
        enabled: { type: 'boolean' },
        order: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or action already exists',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @MinLevel(3)
  async createAction(@Body() dto: CreateActionDto): Promise<any> {
    return this.actionsService.createAction(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update action' })
  @ApiParam({ name: 'id', description: 'Action ID' })
  @ApiResponse({
    status: 200,
    description: 'Action updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        group: { type: 'string' },
        enabled: { type: 'boolean' },
        order: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Action not found' })
  @MinLevel(3)
  async updateAction(
    @Param('id') id: string,
    @Body() dto: UpdateActionDto,
  ): Promise<any> {
    return this.actionsService.updateAction(id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Enable/disable action' })
  @ApiParam({ name: 'id', description: 'Action ID' })
  @ApiResponse({
    status: 200,
    description: 'Action status toggled successfully',
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
  @ApiResponse({ status: 404, description: 'Action not found' })
  @MinLevel(2)
  async toggleAction(
    @Param('id') id: string,
    @Body('enabled') enabled: boolean,
  ): Promise<{ success: boolean; message: string }> {
    return this.actionsService.toggleAction(id, enabled);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete action' })
  @ApiParam({ name: 'id', description: 'Action ID' })
  @ApiResponse({
    status: 200,
    description: 'Action deleted successfully',
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
  @ApiResponse({ status: 404, description: 'Action not found' })
  @MinLevel(3)
  async deleteAction(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.actionsService.deleteAction(id);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder actions' })
  @ApiResponse({
    status: 200,
    description: 'Actions reordered successfully',
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
  @MinLevel(2)
  async reorderActions(
    @Body() actions: { id: string; order: number }[],
  ): Promise<{ success: boolean; message: string }> {
    return this.actionsService.reorderActions(actions);
  }

  @Get('check/:userId/:actionName')
  @ApiOperation({ summary: 'Check if user can perform action' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'actionName', description: 'Action name' })
  @ApiResponse({
    status: 200,
    description: 'Permission check completed',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        actionName: { type: 'string' },
        canPerform: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'User or action not found' })
  @MinLevel(1)
  async userCanPerformAction(
    @Param('userId') userId: string,
    @Param('actionName') actionName: string,
  ): Promise<{ userId: string; actionName: string; canPerform: boolean }> {
    const canPerform = await this.actionsService.userCanPerformAction(
      userId,
      actionName,
    );
    return { userId, actionName, canPerform };
  }
}
