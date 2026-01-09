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
import { ClientsService } from '../services/clients.service';
import { ListClientsQueryDto, UpdateClientDto, BlockClientDto } from '../dto/clients.dto';
import { BackofficeAuthGuard } from '../../../shared/guards/backoffice-auth.guard';
import { BackofficeRoleGuard, MinLevel } from '../../../shared/guards/backoffice-role.guard';

@Controller('backoffice/clients')
@UseGuards(BackofficeAuthGuard, BackofficeRoleGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}  @Get()
  @MinLevel(2)
  async list(@Query() query: ListClientsQueryDto) {
    return this.clientsService.list(query);
  }  @Get(':id/details')
  @MinLevel(2)
  async getDetails(@Param('id') id: string) {
    return this.clientsService.getDetails(id);
  }  @Get(':id/accounts')
  @MinLevel(2)
  async getAccounts(@Param('id') id: string) {
    return this.clientsService.getAccounts(id);
  }  @Get(':id/logs')
  @MinLevel(2)
  async getLogs(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.clientsService.getLogs(id, { page, limit });
  }  @Get(':id/transactions')
  @MinLevel(2)
  async getTransactions(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.clientsService.getTransactions(id, { page, limit });
  }  @Patch(':id')
  @MinLevel(2)
  async update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }  @Post(':id/block')
  @MinLevel(1)
  async block(@Param('id') id: string, @Body() dto: BlockClientDto) {
    return this.clientsService.block(id, dto);
  }  @Post(':id/unblock')
  @MinLevel(1)
  async unblock(@Param('id') id: string) {
    return this.clientsService.unblock(id);
  }  @Post(':id/disable')
  @MinLevel(1)
  async disable(@Param('id') id: string, @Body() dto: BlockClientDto) {
    return this.clientsService.disable(id, dto);
  }  @Post(':id/enable')
  @MinLevel(1)
  async enable(@Param('id') id: string) {
    return this.clientsService.enable(id);
  }
}
