import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from '../services/roles.service';
import { CreateRoleDto, UpdateRoleDto } from '../dto/role.dto';
import { BackofficeAuthGuard } from '../../../shared/guards/backoffice-auth.guard';
import { BackofficeRoleGuard, MinLevel } from '../../../shared/guards/backoffice-role.guard';

@ApiTags('3.1 Backoffice - Roles')
@ApiBearerAuth('JWT-auth')
@Controller('backoffice/management/roles')
@UseGuards(BackofficeAuthGuard, BackofficeRoleGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @MinLevel(2)
  @ApiOperation({
    summary: 'List roles',
    description: 'Returns a list of all available roles',
  })
  @ApiResponse({ status: 200, description: 'Roles listed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Access denied - Insufficient permission level' })
  async list() {
    return this.rolesService.list();
  }

  @Get(':id')
  @MinLevel(2)
  @ApiOperation({
    summary: 'Get role details',
    description: 'Returns information for a specific role',
  })
  @ApiParam({ name: 'id', type: String, description: 'Role identifier' })
  @ApiResponse({ status: 200, description: 'Role returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Access denied - Insufficient permission level' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async get(@Param('id') id: string) {
    return this.rolesService.get(id);
  }

  @Post()
  @MinLevel(3)
  @ApiOperation({
    summary: 'Create role',
    description: 'Creates a new role with permissions',
  })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Access denied - Insufficient permission level' })
  @ApiResponse({ status: 409, description: 'Role with this name already exists' })
  async create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Put(':id')
  @MinLevel(3)
  @ApiOperation({
    summary: 'Update role',
    description: 'Updates information for an existing role',
  })
  @ApiParam({ name: 'id', type: String, description: 'Role identifier' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Access denied - Insufficient permission level' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @MinLevel(3)
  @ApiOperation({
    summary: 'Delete role',
    description: 'Removes a role from the system',
  })
  @ApiParam({ name: 'id', type: String, description: 'Role identifier' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 400, description: 'Role cannot be deleted - there are linked users' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Access denied - Insufficient permission level' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async delete(@Param('id') id: string) {
    return this.rolesService.delete(id);
  }
}
