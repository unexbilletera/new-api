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
import { StoresService } from '../services/stores.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@ApiTags('9. Stores')
@ApiBearerAuth('JWT-auth')
@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({ summary: 'Search stores' })
  @ApiResponse({ status: 200, description: 'List of stores' })
  async search(@Query() query: SearchQueryDto) {
    return this.storesService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID' })
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiResponse({ status: 200, description: 'Store details' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async select(@Param('id') id: string) {
    return this.storesService.select(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create store' })
  @ApiResponse({ status: 201, description: 'Store created' })
  async create(@Body() data: any) {
    return this.storesService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update store' })
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiResponse({ status: 200, description: 'Store updated' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.storesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete store' })
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiResponse({ status: 200, description: 'Store deleted' })
  async delete(@Param('id') id: string) {
    return this.storesService.delete(id);
  }

  @Get(':id/:field/:value')
  @ApiOperation({ summary: 'Get store by field value' })
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiParam({ name: 'value', description: 'Field value' })
  @ApiResponse({ status: 200, description: 'Store details' })
  async selectByField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Param('value') value: string,
  ) {
    return this.storesService.selectByField(id, field, value);
  }

  @Put(':id/:field')
  @ApiOperation({ summary: 'Update store field' })
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiResponse({ status: 200, description: 'Store field updated' })
  async updateField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Body() body: any,
  ) {
    return this.storesService.updateField(id, field, body.value);
  }
}
