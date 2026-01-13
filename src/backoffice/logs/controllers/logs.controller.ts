import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LogsService } from '../services/logs.service';
import { ListLogsQueryDto } from '../dto/logs.dto';
import { BackofficeAuthGuard } from '../../../shared/guards/backoffice-auth.guard';
import { BackofficeRoleGuard, MinLevel } from '../../../shared/guards/backoffice-role.guard';

@ApiTags('3.3 Backoffice - Logs')
@ApiBearerAuth('JWT-auth')
@Controller('backoffice/logs')
@UseGuards(BackofficeAuthGuard, BackofficeRoleGuard)
@MinLevel(2)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @ApiOperation({
    summary: 'List system logs',
    description: 'Returns a paginated list of system logs (Requires minimum level 2)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records per page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Logs retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient access level',
  })
  async list(@Query() query: ListLogsQueryDto) {
    return this.logsService.list(query);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get log statistics',
    description: 'Returns aggregated log statistics within a period (Requires minimum level 2)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient access level',
  })
  async stats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.logsService.stats(startDate, endDate);
  }

  @Get('actions')
  @ApiOperation({
    summary: 'List recorded actions',
    description: 'Returns the list of all actions that were recorded in the logs (Requires minimum level 2)',
  })
  @ApiResponse({
    status: 200,
    description: 'Actions retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient access level',
  })
  async getActions() {
    return this.logsService.getActions();
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get user logs',
    description: 'Returns all logs associated with a specific user (Requires minimum level 2)',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'User identifier',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records per page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'User logs retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient access level',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserLogs(
    @Param('userId') userId: string,
    @Query() query: ListLogsQueryDto,
  ) {
    return this.logsService.getUserLogs(userId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get log by ID',
    description: 'Returns the details of a specific log (Requires minimum level 2)',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Log identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Log retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient access level',
  })
  @ApiResponse({
    status: 404,
    description: 'Log not found',
  })
  async get(@Param('id') id: string) {
    return this.logsService.get(id);
  }
}
