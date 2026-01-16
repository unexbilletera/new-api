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
import { SailpointsService } from '../services/sailpoints.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@ApiTags('13. Sailpoints')
@ApiBearerAuth('JWT-auth')
@Controller('sailpoints')
@UseGuards(JwtAuthGuard)
export class SailpointsController {
  constructor(private readonly sailpointsService: SailpointsService) {}

  @Get()
  @ApiOperation({ summary: 'Search sailpoints' })
  @ApiResponse({ status: 200, description: 'List of sailpoints' })
  async search(@Query() query: SearchQueryDto) {
    return this.sailpointsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sailpoint by ID' })
  @ApiParam({ name: 'id', description: 'Sailpoint ID' })
  @ApiResponse({ status: 200, description: 'Sailpoint details' })
  @ApiResponse({ status: 404, description: 'Sailpoint not found' })
  async select(@Param('id') id: string) {
    return this.sailpointsService.select(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create sailpoint' })
  @ApiResponse({ status: 201, description: 'Sailpoint created' })
  async create(@Body() data: any) {
    return this.sailpointsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update sailpoint' })
  @ApiParam({ name: 'id', description: 'Sailpoint ID' })
  @ApiResponse({ status: 200, description: 'Sailpoint updated' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.sailpointsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete sailpoint' })
  @ApiParam({ name: 'id', description: 'Sailpoint ID' })
  @ApiResponse({ status: 200, description: 'Sailpoint deleted' })
  async delete(@Param('id') id: string) {
    return this.sailpointsService.delete(id);
  }

  @Get(':id/:field/:value')
  @ApiOperation({ summary: 'Get sailpoint by field value' })
  @ApiParam({ name: 'id', description: 'Sailpoint ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiParam({ name: 'value', description: 'Field value' })
  @ApiResponse({ status: 200, description: 'Sailpoint details' })
  async selectByField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Param('value') value: string,
  ) {
    return this.sailpointsService.selectByField(id, field, value);
  }

  @Put(':id/:field')
  @ApiOperation({ summary: 'Update sailpoint field' })
  @ApiParam({ name: 'id', description: 'Sailpoint ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiResponse({ status: 200, description: 'Sailpoint field updated' })
  async updateField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Body() body: any,
  ) {
    return this.sailpointsService.updateField(id, field, body.value);
  }
}
