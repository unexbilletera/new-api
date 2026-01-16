import {
  Controller,
  Post,
  Get,
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
import { TransactionCreationService } from '../services/transaction-creation.service';
import {
  CreateCashinDto,
  CreateCashoutDto,
  CreateTransferDto,
  CreatePaymentDto,
  CreatePaymentQrDto,
  CreateRechargeDto,
  CreateMantecaExchangeDto,
  CreateCoelsaDto,
  ConfirmTransactionDto,
  CancelTransactionDto,
  TicketTransactionQueryDto,
} from '../dto/create-transaction.dto';

@ApiTags('5.1 Transactions - Create')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class TransactionCreationController {
  constructor(
    private readonly transactionCreationService: TransactionCreationService,
  ) {}

  @Post('createTransaction/cashin')
  @ApiOperation({ summary: 'Create cashin transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createCashin(@Body() dto: CreateCashinDto, @Request() req: any) {
    return this.transactionCreationService.createCashin(dto, req.user);
  }

  @Post('createTransaction/cashout')
  @ApiOperation({ summary: 'Create cashout transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createCashout(@Body() dto: CreateCashoutDto, @Request() req: any) {
    return this.transactionCreationService.createCashout(dto, req.user);
  }

  @Post('createTransaction/transfer')
  @ApiOperation({ summary: 'Create transfer transaction (PIX, CVU, CBU)' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createTransfer(@Body() dto: CreateTransferDto, @Request() req: any) {
    return this.transactionCreationService.createTransfer(dto, req.user);
  }

  @Post('createTransaction/cashback')
  @ApiOperation({ summary: 'Create cashback transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createCashback(@Body() dto: CreateCashinDto, @Request() req: any) {
    return this.transactionCreationService.createCashback(dto, req.user);
  }

  @Post('createTransaction/payment')
  @ApiOperation({ summary: 'Create payment transaction (boleto)' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createPayment(@Body() dto: CreatePaymentDto, @Request() req: any) {
    return this.transactionCreationService.createPayment(dto, req.user);
  }

  @Post('createTransaction/paymentQr')
  @ApiOperation({ summary: 'Create payment QR transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createPaymentQr(@Body() dto: CreatePaymentQrDto, @Request() req: any) {
    return this.transactionCreationService.createPaymentQr(dto, req.user);
  }

  @Post('createTransaction/paymentGire')
  @ApiOperation({
    summary: 'Create payment GIRE transaction (Argentina boleto)',
  })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createPaymentGire(@Body() dto: CreatePaymentDto, @Request() req: any) {
    return this.transactionCreationService.createPaymentGire(dto, req.user);
  }

  @Post('createTransaction/paymentCronos')
  @ApiOperation({
    summary: 'Create payment Cronos transaction (Brazil boleto)',
  })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createPaymentCronos(
    @Body() dto: CreatePaymentDto,
    @Request() req: any,
  ) {
    return this.transactionCreationService.createPaymentCronos(dto, req.user);
  }

  @Post('createTransaction/cashoutCronosQr')
  @ApiOperation({
    summary: 'Create cashout Cronos QR transaction (Brazil QR/PIX)',
  })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createCashoutCronosQr(
    @Body() dto: CreatePaymentQrDto,
    @Request() req: any,
  ) {
    return this.transactionCreationService.createCashoutCronosQr(dto, req.user);
  }

  @Post('createTransaction/cashoutMantecaQrAr')
  @ApiOperation({ summary: 'Create cashout Manteca QR AR transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createCashoutMantecaQrAr(
    @Body() dto: CreatePaymentQrDto,
    @Request() req: any,
  ) {
    return this.transactionCreationService.createCashoutMantecaQrAr(
      dto,
      req.user,
    );
  }

  @Post('createTransaction/cashoutMantecaQrBr')
  @ApiOperation({ summary: 'Create cashout Manteca QR BR transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createCashoutMantecaQrBr(
    @Body() dto: CreatePaymentQrDto,
    @Request() req: any,
  ) {
    return this.transactionCreationService.createCashoutMantecaQrBr(
      dto,
      req.user,
    );
  }

  @Post('createTransaction/cashoutMantecaExchangeAr')
  @ApiOperation({
    summary: 'Create Manteca Exchange AR transaction (ARS → BRL)',
  })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createCashoutMantecaExchangeAr(
    @Body() dto: CreateMantecaExchangeDto,
    @Request() req: any,
  ) {
    return this.transactionCreationService.createCashoutMantecaExchangeAr(
      dto,
      req.user,
    );
  }

  @Post('createTransaction/cashoutMantecaExchangeBr')
  @ApiOperation({
    summary: 'Create Manteca Exchange BR transaction (BRL → ARS)',
  })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createCashoutMantecaExchangeBr(
    @Body() dto: CreateMantecaExchangeDto,
    @Request() req: any,
  ) {
    return this.transactionCreationService.createCashoutMantecaExchangeBr(
      dto,
      req.user,
    );
  }

  @Post('createTransaction/cashoutGire')
  @ApiOperation({ summary: 'Create cashout GIRE transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createCashoutGire(@Body() dto: CreateCashoutDto, @Request() req: any) {
    return this.transactionCreationService.createCashoutGire(dto, req.user);
  }

  @Post('createTransaction/rechargeGire')
  @ApiOperation({ summary: 'Create recharge GIRE transaction (Argentina)' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createRechargeGire(
    @Body() dto: CreateRechargeDto,
    @Request() req: any,
  ) {
    return this.transactionCreationService.createRechargeGire(dto, req.user);
  }

  @Post('createTransaction/rechargeCronos')
  @ApiOperation({ summary: 'Create recharge Cronos transaction (Brazil)' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createRechargeCronos(
    @Body() dto: CreateRechargeDto,
    @Request() req: any,
  ) {
    return this.transactionCreationService.createRechargeCronos(dto, req.user);
  }

  @Post('createTransaction/cashinCoelsa')
  @ApiOperation({ summary: 'Create cashin COELSA transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createCashinCoelsa(@Body() dto: CreateCoelsaDto, @Request() req: any) {
    return this.transactionCreationService.createCashinCoelsa(dto, req.user);
  }

  @Post('createTransaction/cashoutCoelsa')
  @ApiOperation({ summary: 'Create cashout COELSA transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createCashoutCoelsa(@Body() dto: CreateCoelsaDto, @Request() req: any) {
    return this.transactionCreationService.createCashoutCoelsa(dto, req.user);
  }

  @Post('createTransaction/refoundCoelsa')
  @ApiOperation({ summary: 'Create refund COELSA transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createRefoundCoelsa(@Body() dto: CreateCoelsaDto, @Request() req: any) {
    return this.transactionCreationService.createRefoundCoelsa(dto, req.user);
  }

  @Post('confirmTransaction')
  @ApiOperation({ summary: 'Confirm a pending transaction' })
  @ApiResponse({ status: 200, description: 'Transaction confirmed' })
  async confirmTransaction(
    @Body() dto: ConfirmTransactionDto,
    @Request() req: any,
  ) {
    return this.transactionCreationService.confirmTransaction(dto, req.user);
  }

  @Post('cancelTransaction')
  @ApiOperation({ summary: 'Cancel a pending transaction' })
  @ApiResponse({ status: 200, description: 'Transaction cancelled' })
  async cancelTransaction(
    @Body() dto: CancelTransactionDto,
    @Request() req: any,
  ) {
    return this.transactionCreationService.cancelTransaction(dto, req.user);
  }

  @Get('selectTransaction/:id')
  @ApiOperation({ summary: 'Get transaction details' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async selectTransaction(@Param('id') id: string, @Request() req: any) {
    return this.transactionCreationService.selectTransaction(id, req.user);
  }

  @Get('ticketTransaction/:id')
  @ApiOperation({ summary: 'Get transaction ticket (HTML or PDF)' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction ticket' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async ticketTransaction(
    @Param('id') id: string,
    @Query() query: TicketTransactionQueryDto,
    @Request() req: any,
  ) {
    return this.transactionCreationService.ticketTransaction(
      id,
      req.user,
      query.contentType,
    );
  }
}
