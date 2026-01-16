import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
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
  ApiQuery,
} from '@nestjs/swagger';
import { BackofficeAuthGuard } from '../../../shared/guards/backoffice-auth.guard';
import { NewsService } from '../services/news.service';

@ApiTags('Backoffice - News')
@ApiBearerAuth('JWT-auth')
@Controller('backoffice/news')
@UseGuards(BackofficeAuthGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'List all news' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'List of news' })
  async listNews(@Query('status') status?: string) {
    return this.newsService.listNews(status);
  }

  @Post()
  @ApiOperation({ summary: 'Create new news' })
  @ApiResponse({ status: 201, description: 'News created' })
  async createNews(@Body() data: any) {
    return this.newsService.createNews(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update news' })
  @ApiParam({ name: 'id', description: 'News ID' })
  @ApiResponse({ status: 200, description: 'News updated' })
  async updateNews(@Param('id') id: string, @Body() data: any) {
    return this.newsService.updateNews(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete news' })
  @ApiParam({ name: 'id', description: 'News ID' })
  @ApiResponse({ status: 200, description: 'News deleted' })
  async deleteNews(@Param('id') id: string) {
    return this.newsService.deleteNews(id);
  }

  @Patch(':id/enable')
  @ApiOperation({ summary: 'Enable news' })
  @ApiParam({ name: 'id', description: 'News ID' })
  @ApiResponse({ status: 200, description: 'News enabled' })
  async enableNews(@Param('id') id: string) {
    return this.newsService.enableNews(id);
  }

  @Patch(':id/disable')
  @ApiOperation({ summary: 'Disable news' })
  @ApiParam({ name: 'id', description: 'News ID' })
  @ApiResponse({ status: 200, description: 'News disabled' })
  async disableNews(@Param('id') id: string) {
    return this.newsService.disableNews(id);
  }
}
