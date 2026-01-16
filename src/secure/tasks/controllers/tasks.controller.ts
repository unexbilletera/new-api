import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { TasksService } from '../services/tasks.service';

@ApiTags('19. Tasks')
@ApiBearerAuth('JWT-auth')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('users/check')
  @ApiOperation({ summary: 'Execute users check task' })
  @ApiResponse({ status: 200, description: 'Task executed' })
  async usersCheckPost() {
    return this.tasksService.usersCheck();
  }

  @Get('users/check')
  @ApiOperation({ summary: 'Execute users check task (GET)' })
  @ApiResponse({ status: 200, description: 'Task executed' })
  async usersCheckGet() {
    return this.tasksService.usersCheck();
  }
}
