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
import { BranchesService } from '../services/branches.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@ApiTags('12. Branches')
@ApiBearerAuth('JWT-auth')
@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'Search branches' })
  @ApiResponse({ status: 200, description: 'List of branches' })
  async search(@Query() query: SearchQueryDto) {
    return this.branchesService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Branch details' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async select(@Param('id') id: string) {
    return this.branchesService.select(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create branch' })
  @ApiResponse({ status: 201, description: 'Branch created' })
  async create(@Body() data: any) {
    return this.branchesService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update branch' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Branch updated' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.branchesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete branch' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Branch deleted' })
  async delete(@Param('id') id: string) {
    return this.branchesService.delete(id);
  }

  @Get(':id/:field/:value')
  @ApiOperation({ summary: 'Get branch by field value' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiParam({ name: 'value', description: 'Field value' })
  @ApiResponse({ status: 200, description: 'Branch details' })
  async selectByField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Param('value') value: string,
  ) {
    return this.branchesService.selectByField(id, field, value);
  }

  @Put(':id/:field')
  @ApiOperation({ summary: 'Update branch field' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiResponse({ status: 200, description: 'Branch field updated' })
  async updateField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Body() body: any,
  ) {
    return this.branchesService.updateField(id, field, body.value);
  }
}
