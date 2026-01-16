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

@ApiTags('21. Users Identities')
@ApiBearerAuth('JWT-auth')
@Controller('usersIdentities')
@UseGuards(JwtAuthGuard)
export class UsersIdentitiesController {
  constructor(private readonly usersDataService: UsersDataService) {}

  @Get()
  @ApiOperation({ summary: 'Search users identities' })
  @ApiResponse({ status: 200, description: 'List of identities' })
  async search(@Query() query: SearchQueryDto, @Request() req: any) {
    return this.usersDataService.searchIdentities(query, req.user?.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get identity by ID' })
  @ApiParam({ name: 'id', description: 'Identity ID' })
  @ApiResponse({ status: 200, description: 'Identity details' })
  async select(@Param('id') id: string, @Request() req: any) {
    return this.usersDataService.selectIdentity(id, req.user?.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create identity' })
  @ApiResponse({ status: 201, description: 'Identity created' })
  async create(@Body() data: any, @Request() req: any) {
    return this.usersDataService.createIdentity(data, req.user?.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update identity' })
  @ApiParam({ name: 'id', description: 'Identity ID' })
  @ApiResponse({ status: 200, description: 'Identity updated' })
  async update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.usersDataService.updateIdentity(id, data, req.user?.userId);
  }

  @Get(':id/:field/:value')
  @ApiOperation({ summary: 'Get identity by field value' })
  @ApiParam({ name: 'id', description: 'Identity ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiParam({ name: 'value', description: 'Field value' })
  @ApiResponse({ status: 200, description: 'Identity details' })
  async selectByField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Param('value') value: string,
  ) {
    return this.usersDataService.selectIdentityByField(id, field, value);
  }

  @Put(':id/:field')
  @ApiOperation({ summary: 'Update identity field' })
  @ApiParam({ name: 'id', description: 'Identity ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiResponse({ status: 200, description: 'Identity field updated' })
  async updateField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Body() body: any,
  ) {
    return this.usersDataService.updateIdentityField(id, field, body.value);
  }
}
