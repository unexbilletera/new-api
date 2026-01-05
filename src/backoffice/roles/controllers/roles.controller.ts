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
import { RolesService } from '../services/roles.service';
import { CreateRoleDto, UpdateRoleDto } from '../dto/role.dto';
import { BackofficeAuthGuard } from '../../../shared/guards/backoffice-auth.guard';
import { BackofficeRoleGuard, MinLevel } from '../../../shared/guards/backoffice-role.guard';

@Controller('backoffice/management/roles')
@UseGuards(BackofficeAuthGuard, BackofficeRoleGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}  @Get()
  @MinLevel(2)
  async list() {
    return this.rolesService.list();
  }  @Get(':id')
  @MinLevel(2)
  async get(@Param('id') id: string) {
    return this.rolesService.get(id);
  }  @Post()
  @MinLevel(3)
  async create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }  @Put(':id')
  @MinLevel(3)
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }  @Delete(':id')
  @MinLevel(3)
  async delete(@Param('id') id: string) {
    return this.rolesService.delete(id);
  }
}
