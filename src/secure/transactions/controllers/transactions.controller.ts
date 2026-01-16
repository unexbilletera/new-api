import {
  Controller,
  Get,
  Post,
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
  ApiQuery,
} from '@nestjs/swagger';
import { TransactionsService } from '../services/transactions.service';
import {
  ListTransactionsQueryDto,
  TransactionFiltersDto,
} from '../dto/list-transactions.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@ApiTags('5.1 Transactions')
@ApiBearerAuth('JWT-auth')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List user transactions' })
  @ApiResponse({ status: 200, description: 'Transactions list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listTransactions(
    @Query() query: ListTransactionsQueryDto,
    @Request() req: any,
  ) {
    return this.transactionsService.listTransactions(req.user.id, query);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get transaction history with filters' })
  @ApiResponse({ status: 200, description: 'Transaction history' })
  async getHistory(
    @Query() query: ListTransactionsQueryDto,
    @Query() filters: TransactionFiltersDto,
    @Request() req: any,
  ) {
    return this.transactionsService.getTransactionHistory(
      req.user.id,
      query,
      filters,
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get transaction summary' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month'],
  })
  @ApiResponse({ status: 200, description: 'Transaction summary' })
  async getSummary(
    @Query('period') period: 'day' | 'week' | 'month',
    @Request() req: any,
  ) {
    return this.transactionsService.getTransactionSummary(
      req.user.id,
      period || 'month',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction details' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransaction(@Param('id') id: string, @Request() req: any) {
    return this.transactionsService.getTransactionById(id, req.user.id);
  }

  @Post('reverse/:id')
  @ApiOperation({ summary: 'Request transaction reversal' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Reversal requested' })
  @ApiResponse({ status: 400, description: 'Cannot reverse transaction' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async requestReversal(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    return this.transactionsService.requestReversal(
      id,
      req.user.id,
      body.reason,
    );
  }
}
