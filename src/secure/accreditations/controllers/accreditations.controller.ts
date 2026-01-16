import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { AccreditationsService } from '../services/accreditations.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@ApiTags('17. Accreditations')
@ApiBearerAuth('JWT-auth')
@Controller('accreditations')
@UseGuards(JwtAuthGuard)
export class AccreditationsController {
  constructor(private readonly accreditationsService: AccreditationsService) {}

  @Get()
  @ApiOperation({ summary: 'Search accreditations' })
  @ApiResponse({ status: 200, description: 'List of accreditations' })
  async search(@Query() query: SearchQueryDto) {
    return this.accreditationsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get accreditation by ID' })
  @ApiParam({ name: 'id', description: 'Accreditation ID' })
  @ApiResponse({ status: 200, description: 'Accreditation details' })
  @ApiResponse({ status: 404, description: 'Accreditation not found' })
  async select(@Param('id') id: string) {
    return this.accreditationsService.select(id);
  }
}
