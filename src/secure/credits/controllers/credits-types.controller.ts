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
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { CreditsTypesService } from '../services/credits-types.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@ApiTags('7.1 Credits Types')
@ApiBearerAuth('JWT-auth')
@Controller('creditsTypes')
@UseGuards(JwtAuthGuard)
export class CreditsTypesController {
  constructor(private readonly creditsTypesService: CreditsTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Search credits types' })
  @ApiResponse({ status: 200, description: 'List of credits types' })
  async search(@Query() query: SearchQueryDto) {
    return this.creditsTypesService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get credits type by ID' })
  @ApiParam({ name: 'id', description: 'Credits type ID' })
  @ApiResponse({ status: 200, description: 'Credits type details' })
  @ApiResponse({ status: 404, description: 'Credits type not found' })
  async select(@Param('id') id: string) {
    return this.creditsTypesService.select(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create credits type' })
  @ApiResponse({ status: 201, description: 'Credits type created' })
  async create(@Body() data: any) {
    return this.creditsTypesService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update credits type' })
  @ApiParam({ name: 'id', description: 'Credits type ID' })
  @ApiResponse({ status: 200, description: 'Credits type updated' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.creditsTypesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete credits type' })
  @ApiParam({ name: 'id', description: 'Credits type ID' })
  @ApiResponse({ status: 200, description: 'Credits type deleted' })
  async delete(@Param('id') id: string) {
    return this.creditsTypesService.delete(id);
  }

  @Get(':id/:field/:value')
  @ApiOperation({ summary: 'Get credits type by field value' })
  @ApiParam({ name: 'id', description: 'Credits type ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiParam({ name: 'value', description: 'Field value' })
  @ApiResponse({ status: 200, description: 'Credits type details' })
  async selectByField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Param('value') value: string,
  ) {
    return this.creditsTypesService.selectByField(id, field, value);
  }

  @Put(':id/:field')
  @ApiOperation({ summary: 'Update credits type field' })
  @ApiParam({ name: 'id', description: 'Credits type ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiResponse({ status: 200, description: 'Credits type field updated' })
  async updateField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Body() body: any,
  ) {
    return this.creditsTypesService.updateField(id, field, body.value);
  }
}
