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
import { CardsService } from '../services/cards.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@ApiTags('6. Cards')
@ApiBearerAuth('JWT-auth')
@Controller('cards')
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  @ApiOperation({ summary: 'Search cards' })
  @ApiResponse({ status: 200, description: 'List of cards' })
  async search(@Query() query: SearchQueryDto, @Request() req: any) {
    return this.cardsService.search(query, req.user?.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get card by ID' })
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiResponse({ status: 200, description: 'Card details' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async select(@Param('id') id: string, @Request() req: any) {
    return this.cardsService.select(id, req.user?.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create card' })
  @ApiResponse({ status: 201, description: 'Card created' })
  async create(@Body() data: any, @Request() req: any) {
    return this.cardsService.create(data, req.user?.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update card' })
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiResponse({ status: 200, description: 'Card updated' })
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.cardsService.update(id, data, req.user?.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete card' })
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiResponse({ status: 200, description: 'Card deleted' })
  async delete(@Param('id') id: string) {
    return this.cardsService.delete(id);
  }

  @Get(':id/:field/:value')
  @ApiOperation({ summary: 'Get card by field value' })
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiParam({ name: 'value', description: 'Field value' })
  @ApiResponse({ status: 200, description: 'Card details' })
  async selectByField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Param('value') value: string,
  ) {
    return this.cardsService.selectByField(id, field, value);
  }

  @Put('disable/:id')
  @ApiOperation({ summary: 'Disable card' })
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiResponse({ status: 200, description: 'Card disabled' })
  async disable(@Param('id') id: string) {
    return this.cardsService.disable(id);
  }

  @Put(':id/:field')
  @ApiOperation({ summary: 'Update card field' })
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiResponse({ status: 200, description: 'Card field updated' })
  async updateField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Body() body: any,
  ) {
    return this.cardsService.updateField(id, field, body.value);
  }
}
