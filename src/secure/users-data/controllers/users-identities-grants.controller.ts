import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { UsersDataService } from '../services/users-data.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@ApiTags('21.1 Users Identities Grants')
@ApiBearerAuth('JWT-auth')
@Controller('usersIdentitiesGrants')
@UseGuards(JwtAuthGuard)
export class UsersIdentitiesGrantsController {
  constructor(private readonly usersDataService: UsersDataService) {}

  @Get()
  @ApiOperation({ summary: 'Search users identities grants' })
  @ApiResponse({ status: 200, description: 'List of grants' })
  async search(@Query() query: SearchQueryDto, @Request() req: any) {
    return this.usersDataService.searchGrants(query, req.user?.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get grant by ID' })
  @ApiParam({ name: 'id', description: 'Grant ID' })
  @ApiResponse({ status: 200, description: 'Grant details' })
  async select(@Param('id') id: string, @Request() req: any) {
    return this.usersDataService.selectGrant(id, req.user?.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create grant' })
  @ApiResponse({ status: 201, description: 'Grant created' })
  async create(@Body() data: any, @Request() req: any) {
    return this.usersDataService.createGrant(data, req.user?.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update grant' })
  @ApiParam({ name: 'id', description: 'Grant ID' })
  @ApiResponse({ status: 200, description: 'Grant updated' })
  async update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.usersDataService.updateGrant(id, data, req.user?.userId);
  }
}
