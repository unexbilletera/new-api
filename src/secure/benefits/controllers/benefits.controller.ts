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
import { BenefitsService } from '../services/benefits.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@ApiTags('11. Benefits')
@ApiBearerAuth('JWT-auth')
@Controller('benefits')
@UseGuards(JwtAuthGuard)
export class BenefitsController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Get()
  @ApiOperation({ summary: 'Search benefits' })
  @ApiResponse({ status: 200, description: 'List of benefits' })
  async search(@Query() query: SearchQueryDto) {
    return this.benefitsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get benefit by ID' })
  @ApiParam({ name: 'id', description: 'Benefit ID' })
  @ApiResponse({ status: 200, description: 'Benefit details' })
  @ApiResponse({ status: 404, description: 'Benefit not found' })
  async select(@Param('id') id: string) {
    return this.benefitsService.select(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create benefit' })
  @ApiResponse({ status: 201, description: 'Benefit created' })
  async create(@Body() data: any) {
    return this.benefitsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update benefit' })
  @ApiParam({ name: 'id', description: 'Benefit ID' })
  @ApiResponse({ status: 200, description: 'Benefit updated' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.benefitsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete benefit' })
  @ApiParam({ name: 'id', description: 'Benefit ID' })
  @ApiResponse({ status: 200, description: 'Benefit deleted' })
  async delete(@Param('id') id: string) {
    return this.benefitsService.delete(id);
  }

  @Get(':id/:field/:value')
  @ApiOperation({ summary: 'Get benefit by field value' })
  @ApiParam({ name: 'id', description: 'Benefit ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiParam({ name: 'value', description: 'Field value' })
  @ApiResponse({ status: 200, description: 'Benefit details' })
  async selectByField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Param('value') value: string,
  ) {
    return this.benefitsService.selectByField(id, field, value);
  }

  @Put(':id/:field')
  @ApiOperation({ summary: 'Update benefit field' })
  @ApiParam({ name: 'id', description: 'Benefit ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiResponse({ status: 200, description: 'Benefit field updated' })
  async updateField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Body() body: any,
  ) {
    return this.benefitsService.updateField(id, field, body.value);
  }
}
