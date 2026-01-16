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
import { ContactsService } from '../services/contacts.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@ApiTags('8. Contacts')
@ApiBearerAuth('JWT-auth')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'Search contacts' })
  @ApiResponse({ status: 200, description: 'List of contacts' })
  async search(@Query() query: SearchQueryDto, @Request() req: any) {
    return this.contactsService.search(query, req.user?.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Contact details' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async select(@Param('id') id: string, @Request() req: any) {
    return this.contactsService.select(id, req.user?.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create contact' })
  @ApiResponse({ status: 201, description: 'Contact created' })
  async create(@Body() data: any, @Request() req: any) {
    return this.contactsService.create(data, req.user?.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update contact' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Contact updated' })
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.contactsService.update(id, data, req.user?.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contact' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Contact deleted' })
  async delete(@Param('id') id: string) {
    return this.contactsService.delete(id);
  }

  @Get(':id/:field/:value')
  @ApiOperation({ summary: 'Get contact by field value' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiParam({ name: 'value', description: 'Field value' })
  @ApiResponse({ status: 200, description: 'Contact details' })
  async selectByField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Param('value') value: string,
  ) {
    return this.contactsService.selectByField(id, field, value);
  }

  @Put('disable/:id')
  @ApiOperation({ summary: 'Disable contact' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Contact disabled' })
  async disable(@Param('id') id: string) {
    return this.contactsService.disable(id);
  }

  @Put(':id/:field')
  @ApiOperation({ summary: 'Update contact field' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiResponse({ status: 200, description: 'Contact field updated' })
  async updateField(
    @Param('id') id: string,
    @Param('field') field: string,
    @Body() body: any,
  ) {
    return this.contactsService.updateField(id, field, body.value);
  }
}
