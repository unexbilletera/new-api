import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { GireService } from '../services/gire.service';
import {
  GetBillsDto,
  GireCompanyDto,
  GireBillDto,
  GireOperationDto,
} from '../dto/gire.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@ApiTags('5.6 GIRE (Argentina)')
@ApiBearerAuth('JWT-auth')
@Controller('gire')
@UseGuards(JwtAuthGuard)
export class GireController {
  constructor(private readonly gireService: GireService) {}

  @Get('companies/:name')
  @ApiOperation({ summary: 'Search companies by name' })
  @ApiParam({ name: 'name', description: 'Company name to search' })
  @ApiResponse({
    status: 200,
    description: 'Companies found',
    type: [GireCompanyDto],
  })
  async searchCompanies(@Param('name') name: string) {
    return this.gireService.searchCompanies(name);
  }

  @Get('rechargeCompanies')
  @ApiOperation({ summary: 'Get recharge companies' })
  @ApiResponse({ status: 200, description: 'Recharge companies list' })
  async getRechargeCompanies() {
    return this.gireService.getRechargeCompanies();
  }

  @Get('rechargeCompanies/:id')
  @ApiOperation({ summary: 'Get recharge company details' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company details' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getRechargeCompanyById(@Param('id') id: string) {
    return this.gireService.getRechargeCompanyById(id);
  }

  @Get('paymentModes/:id')
  @ApiOperation({ summary: 'Get payment modes for a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Payment modes' })
  async getPaymentModes(@Param('id') id: string) {
    return this.gireService.getPaymentModes(id);
  }

  @Post('bills/:id1/:id2')
  @ApiOperation({ summary: 'Get bills by identifiers' })
  @ApiParam({ name: 'id1', description: 'First identifier' })
  @ApiParam({ name: 'id2', description: 'Second identifier' })
  @ApiResponse({ status: 200, description: 'Bills found', type: [GireBillDto] })
  async getBills(
    @Param('id1') id1: string,
    @Param('id2') id2: string,
    @Body() dto: GetBillsDto,
  ) {
    return this.gireService.getBills(id1, id2, dto);
  }

  @Get('bills/:barcode')
  @ApiOperation({ summary: 'Get bill by barcode' })
  @ApiParam({ name: 'barcode', description: 'Barcode' })
  @ApiResponse({ status: 200, description: 'Bill details', type: GireBillDto })
  async getBillByBarcode(@Param('barcode') barcode: string) {
    return this.gireService.getBillByBarcode(barcode);
  }

  @Get('operations/:operationId')
  @ApiOperation({ summary: 'Get operation status' })
  @ApiParam({ name: 'operationId', description: 'Operation ID' })
  @ApiResponse({
    status: 200,
    description: 'Operation status',
    type: GireOperationDto,
  })
  @ApiResponse({ status: 404, description: 'Operation not found' })
  async getOperationStatus(@Param('operationId') operationId: string) {
    return this.gireService.getOperationStatus(operationId);
  }

  @Get('operations/ticket/:operationId')
  @ApiOperation({ summary: 'Get operation ticket' })
  @ApiParam({ name: 'operationId', description: 'Operation ID' })
  @ApiResponse({ status: 200, description: 'Operation ticket' })
  @ApiResponse({ status: 404, description: 'Operation not found' })
  async getOperationTicket(@Param('operationId') operationId: string) {
    return this.gireService.getOperationTicket(operationId);
  }
}
