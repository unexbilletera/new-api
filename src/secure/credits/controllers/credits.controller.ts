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
import { CreditsService } from '../services/credits.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@ApiTags('7. Credits')
@ApiBearerAuth('JWT-auth')
@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get()
  @ApiOperation({ summary: 'Search credits' })
  @ApiResponse({ status: 200, description: 'List of credits' })
  async search(@Query() query: SearchQueryDto, @Request() req: any) {
    return this.creditsService.search(query, req.user?.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get credit by ID' })
  @ApiParam({ name: 'id', description: 'Credit ID' })
  @ApiResponse({ status: 200, description: 'Credit details' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  async select(@Param('id') id: string, @Request() req: any) {
    return this.creditsService.select(id, req.user?.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create credit' })
  @ApiResponse({ status: 201, description: 'Credit created' })
  async create(@Body() data: any, @Request() req: any) {
    return this.creditsService.create(data, req.user?.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update credit' })
  @ApiParam({ name: 'id', description: 'Credit ID' })
  @ApiResponse({ status: 200, description: 'Credit updated' })
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.creditsService.update(id, data, req.user?.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete credit' })
  @ApiParam({ name: 'id', description: 'Credit ID' })
  @ApiResponse({ status: 200, description: 'Credit deleted' })
  async delete(@Param('id') id: string) {
    return this.creditsService.delete(id);
  }

  @Get(':id/:field/:value')
  @ApiOperation({ summary: 'Get credit by field value' })
  @ApiParam({ name: 'id', description: 'Credit ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiParam({ name: 'value', description: 'Field value' })
  @ApiResponse({ status: 200, description: 'Credit details' })
  async selectByField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Param('value') value: string,
  ) {
    return this.creditsService.selectByField(id, field, value);
  }

  @Put(':id/:field')
  @ApiOperation({ summary: 'Update credit field' })
  @ApiParam({ name: 'id', description: 'Credit ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiResponse({ status: 200, description: 'Credit field updated' })
  async updateField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Body() body: any,
  ) {
    return this.creditsService.updateField(id, field, body.value);
  }
}
