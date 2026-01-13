import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BackofficeUsersService } from '../services/backoffice-users.service';
import {
  CreateBackofficeUserDto,
  UpdateBackofficeUserDto,
  ListBackofficeUsersQueryDto,
} from '../dto/backoffice-user.dto';
import { BackofficeAuthGuard } from '../../../shared/guards/backoffice-auth.guard';
import {
  BackofficeRoleGuard,
  MinLevel,
} from '../../../shared/guards/backoffice-role.guard';

@ApiTags('3.2 Backoffice - Users')
@ApiBearerAuth('JWT-auth')
@Controller('backoffice/management/users')
@UseGuards(BackofficeAuthGuard, BackofficeRoleGuard)
export class BackofficeUsersController {
  constructor(private readonly usersService: BackofficeUsersService) {}

  @Get()
  @MinLevel(2)
  @ApiOperation({
    summary: 'List backoffice users',
    description: 'Returns a list of backoffice users',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or email',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status (active/inactive)',
  })
  @ApiQuery({
    name: 'roleId',
    required: false,
    type: String,
    description: 'Filter by role ID',
  })
  @ApiResponse({ status: 200, description: 'Users list returned successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Insufficient permission level',
  })
  async list(@Query() query: ListBackofficeUsersQueryDto) {
    return this.usersService.list(query);
  }

  @Get(':id')
  @MinLevel(2)
  @ApiOperation({
    summary: 'Get user details',
    description: 'Returns information for a specific user',
  })
  @ApiParam({ name: 'id', type: String, description: 'User identifier' })
  @ApiResponse({ status: 200, description: 'User returned successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Insufficient permission level',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async get(@Param('id') id: string) {
    return this.usersService.get(id);
  }

  @Post()
  @MinLevel(3)
  @ApiOperation({
    summary: 'Create backoffice user',
    description: 'Creates a new user for the backoffice',
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Insufficient permission level',
  })
  @ApiResponse({ status: 409, description: 'Email is already in use' })
  async create(@Body() dto: CreateBackofficeUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @MinLevel(3)
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates user information',
  })
  @ApiParam({ name: 'id', type: String, description: 'User identifier' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Insufficient permission level',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email is already in use' })
  async update(@Param('id') id: string, @Body() dto: UpdateBackofficeUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @MinLevel(3)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Removes a user from the backoffice',
  })
  @ApiParam({ name: 'id', type: String, description: 'User identifier' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete your own user' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Insufficient permission level',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
