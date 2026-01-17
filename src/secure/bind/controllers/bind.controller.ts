import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { BindOperationsService } from '../services/bind-operations.service';
import {
  TransactionFiltersDto,
  BindProxyDto,
  BindAccountDto,
  BindTransactionDto,
  BindTransferDto,
  CreateCvuDto,
  CvuResponseDto,
} from '../dto/bind.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@ApiTags('5.8 Bind (Argentina)')
@ApiBearerAuth('JWT-auth')
@Controller('bind')
@UseGuards(JwtAuthGuard)
export class BindController {
  constructor(private readonly bindOperationsService: BindOperationsService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'List user Bind accounts' })
  @ApiResponse({
    status: 200,
    description: 'Bind accounts list',
    type: [BindAccountDto],
  })
  async listAccounts(@Request() req: any) {
    return this.bindOperationsService.listAccounts(req.user.id);
  }

  @Post('cvu')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create CVU for user' })
  @ApiResponse({
    status: 201,
    description: 'CVU created successfully',
    type: CvuResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data or missing identity' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async createCvu(@Body() dto: CreateCvuDto, @Request() req: any) {
    return this.bindOperationsService.createCvu(
      req.user.id,
      req.user.defaultUserIdentityId,
      dto.alias,
    );
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get Bind account details' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({
    status: 200,
    description: 'Account details',
    type: BindAccountDto,
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccountById(@Param('id') id: string, @Request() req: any) {
    return this.bindOperationsService.getAccountById(req.user.id, id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List Bind transactions' })
  @ApiResponse({
    status: 200,
    description: 'Transactions list',
  })
  async listTransactions(
    @Query() filters: TransactionFiltersDto,
    @Request() req: any,
  ) {
    return this.bindOperationsService.listTransactions(req.user.id, filters);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get Bind transaction details' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction details',
    type: BindTransactionDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransactionById(@Param('id') id: string, @Request() req: any) {
    return this.bindOperationsService.getTransactionById(req.user.id, id);
  }

  @Get('transactions/:id/:date')
  @ApiOperation({ summary: 'Get Bind transaction by ID and date' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiParam({ name: 'date', description: 'Transaction date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransactionByIdAndDate(
    @Param('id') id: string,
    @Param('date') date: string,
    @Request() req: any,
  ) {
    return this.bindOperationsService.getTransactionByIdAndDate(
      req.user.id,
      id,
      date,
    );
  }

  @Get('transfers')
  @ApiOperation({ summary: 'List Bind transfers' })
  @ApiResponse({
    status: 200,
    description: 'Transfers list',
  })
  async listTransfers(
    @Query() filters: TransactionFiltersDto,
    @Request() req: any,
  ) {
    return this.bindOperationsService.listTransfers(req.user.id, filters);
  }

  @Get('transfers/:id')
  @ApiOperation({ summary: 'Get Bind transfer details' })
  @ApiParam({ name: 'id', description: 'Transfer ID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer details',
    type: BindTransferDto,
  })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async getTransferById(@Param('id') id: string, @Request() req: any) {
    return this.bindOperationsService.getTransferById(req.user.id, id);
  }

  @Post('proxy')
  @ApiOperation({ summary: 'Proxy request to Bind API (admin)' })
  @ApiResponse({ status: 200, description: 'Proxy response' })
  async proxy(@Body() dto: BindProxyDto) {
    return this.bindOperationsService.proxyRequest(dto.body);
  }
}
