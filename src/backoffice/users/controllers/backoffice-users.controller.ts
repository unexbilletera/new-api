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
import { BackofficeUsersService } from '../services/backoffice-users.service';
import {
  CreateBackofficeUserDto,
  UpdateBackofficeUserDto,
  ListBackofficeUsersQueryDto,
} from '../dto/backoffice-user.dto';
import { BackofficeAuthGuard } from '../../../shared/guards/backoffice-auth.guard';
import { BackofficeRoleGuard, MinLevel } from '../../../shared/guards/backoffice-role.guard';

@Controller('backoffice/management/users')
@UseGuards(BackofficeAuthGuard, BackofficeRoleGuard)
export class BackofficeUsersController {
  constructor(private readonly usersService: BackofficeUsersService) {}  @Get()
  @MinLevel(2)
  async list(@Query() query: ListBackofficeUsersQueryDto) {
    return this.usersService.list(query);
  }  @Get(':id')
  @MinLevel(2)
  async get(@Param('id') id: string) {
    return this.usersService.get(id);
  }  @Post()
  @MinLevel(3)
  async create(@Body() dto: CreateBackofficeUserDto) {
    return this.usersService.create(dto);
  }  @Put(':id')
  @MinLevel(3)
  async update(@Param('id') id: string, @Body() dto: UpdateBackofficeUserDto) {
    return this.usersService.update(id, dto);
  }  @Delete(':id')
  @MinLevel(3)
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
