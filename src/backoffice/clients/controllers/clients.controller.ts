import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClientsService } from '../services/clients.service';
import { ListClientsQueryDto, UpdateClientDto, BlockClientDto } from '../dto/clients.dto';
import { BackofficeAuthGuard } from '../../../shared/guards/backoffice-auth.guard';
import { BackofficeRoleGuard, MinLevel } from '../../../shared/guards/backoffice-role.guard';

@ApiTags('backoffice-clients')
@ApiBearerAuth('JWT-auth')
@Controller('backoffice/clients')
@UseGuards(BackofficeAuthGuard, BackofficeRoleGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @MinLevel(2)
  @ApiOperation({
    summary: 'List clients',
    description: 'Lists all clients with optional filters for status, date and text search',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of records per page' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by client status' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date for filter (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date for filter (ISO 8601)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name, email or document' })
  @ApiResponse({ status: 200, description: 'Clients list returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Access denied - Insufficient permission level' })
  async list(@Query() query: ListClientsQueryDto) {
    return this.clientsService.list(query);
  }

  @Get(':id/details')
  @MinLevel(2)
  @ApiOperation({
    summary: 'Get client details',
    description: 'Returns detailed information for a specific client including identities and accounts',
  })
  @ApiParam({ name: 'id', type: String, description: 'Client identifier' })
  @ApiResponse({ status: 200, description: 'Client details returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Access denied - Insufficient permission level' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getDetails(@Param('id') id: string) {
    return this.clientsService.getDetails(id);
  }

  @Get(':id/accounts')
  @MinLevel(2)
  @ApiOperation({
    summary: 'Get client accounts',
    description: 'Returns the client\'s bank accounts',
  })
  @ApiParam({ name: 'id', type: String, description: 'Client identifier' })
  @ApiResponse({ status: 200, description: 'Accounts list returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Access denied - Insufficient permission level' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getAccounts(@Param('id') id: string) {
    return this.clientsService.getAccounts(id);
  }

  @Get(':id/logs')
  @MinLevel(2)
  @ApiOperation({
    summary: 'Get client logs',
    description: 'Returns the client\'s activity logs',
  })
  @ApiParam({ name: 'id', type: String, description: 'Client identifier' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of records per page' })
  @ApiResponse({ status: 200, description: 'Logs list returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Access denied - Insufficient permission level' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getLogs(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.clientsService.getLogs(id, { page, limit });
  }

  @Get(':id/transactions')
  @MinLevel(2)
  @ApiOperation({
    summary: 'Get client transactions',
    description: 'Returns the client\'s transactions',
  })
  @ApiParam({ name: 'id', type: String, description: 'Client identifier' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of records per page' })
  @ApiResponse({ status: 200, description: 'Transactions list returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Access denied - Insufficient permission level' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getTransactions(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.clientsService.getTransactions(id, { page, limit });
  }

  @Patch(':id')
  @MinLevel(2)
  @ApiOperation({
    summary: 'Update client',
    description: 'Updates information for a specific client',
  })
  @ApiParam({ name: 'id', type: String, description: 'Client identifier' })
  @ApiResponse({ status: 200, description: 'Client updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Access denied - Insufficient permission level' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Post(':id/block')
  @MinLevel(1)
  @ApiOperation({
    summary: 'Block client',
    description: 'Blocks a client preventing future access',
  })
  @ApiParam({ name: 'id', type: String, description: 'Client identifier' })
  @ApiResponse({ status: 200, description: 'Client blocked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or client already blocked' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Access denied - Insufficient permission level' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async block(@Param('id') id: string, @Body() dto: BlockClientDto) {
    return this.clientsService.block(id, dto);
  }

  @Post(':id/unblock')
  @MinLevel(1)
  @ApiOperation({
    summary: 'Unblock client',
    description: 'Unblocks a client allowing access',
  })
  @ApiParam({ name: 'id', type: String, description: 'Client identifier' })
  @ApiResponse({ status: 200, description: 'Client unblocked successfully' })
  @ApiResponse({ status: 400, description: 'Client is not blocked' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Access denied - Insufficient permission level' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async unblock(@Param('id') id: string) {
    return this.clientsService.unblock(id);
  }

  @Post(':id/disable')
  @MinLevel(1)
  @ApiOperation({
    summary: 'Disable client',
    description: 'Disables a specific client with a reason for disabling',
  })
  @ApiParam({ name: 'id', type: String, description: 'Client identifier' })
  @ApiResponse({ status: 200, description: 'Client disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or client already disabled' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Access denied - Insufficient permission level' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async disable(@Param('id') id: string, @Body() dto: BlockClientDto) {
    return this.clientsService.disable(id, dto);
  }

  @Post(':id/enable')
  @MinLevel(1)
  @ApiOperation({
    summary: 'Enable client',
    description: 'Reactivates a client that was disabled',
  })
  @ApiParam({ name: 'id', type: String, description: 'Client identifier' })
  @ApiResponse({ status: 200, description: 'Client enabled successfully' })
  @ApiResponse({ status: 400, description: 'Client is not disabled' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Access denied - Insufficient permission level' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async enable(@Param('id') id: string) {
    return this.clientsService.enable(id);
  }
}
