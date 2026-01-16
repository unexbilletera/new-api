import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { MantecaOperationsService } from '../services/manteca-operations.service';
import {
  QrPaymentDto,
  PaymentLockDto,
  RampOnDto,
  RampOffDto,
  QrPaymentResponseDto,
  RampOperationResponseDto,
  SyntheticStatusResponseDto,
} from '../dto/manteca.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@ApiTags('5.3 Manteca Operations')
@ApiBearerAuth('JWT-auth')
@Controller('manteca')
@UseGuards(JwtAuthGuard)
export class MantecaController {
  constructor(
    private readonly mantecaOperationsService: MantecaOperationsService,
  ) {}

  @Post('qr-payment')
  @ApiOperation({ summary: 'Process QR code payment' })
  @ApiResponse({
    status: 200,
    description: 'QR payment initiated',
    type: QrPaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parameters or limit exceeded',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async qrPayment(@Body() dto: QrPaymentDto, @Request() req: any) {
    return this.mantecaOperationsService.qrPayment(
      dto,
      req.user.id,
      req.user.defaultUserIdentityId,
    );
  }

  @Post('payment-lock')
  @ApiOperation({ summary: 'Create payment lock for QR' })
  @ApiResponse({ status: 200, description: 'Payment lock created' })
  @ApiResponse({
    status: 400,
    description: 'Invalid parameters or limit exceeded',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async paymentLock(@Body() dto: PaymentLockDto, @Request() req: any) {
    return this.mantecaOperationsService.paymentLock(
      dto,
      req.user.id,
      req.user.defaultUserIdentityId,
    );
  }

  @Post('ramp-on')
  @ApiOperation({ summary: 'Ramp On operation (Crypto -> Fiat)' })
  @ApiResponse({
    status: 200,
    description: 'Ramp ON operation initiated',
    type: RampOperationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async rampOn(@Body() dto: RampOnDto, @Request() req: any) {
    return this.mantecaOperationsService.rampOn(
      dto,
      req.user.id,
      req.user.defaultUserIdentityId,
    );
  }

  @Post('ramp-off')
  @ApiOperation({ summary: 'Ramp Off operation (Fiat -> Crypto)' })
  @ApiResponse({
    status: 200,
    description: 'Ramp OFF operation initiated',
    type: RampOperationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parameters or limit exceeded',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async rampOff(@Body() dto: RampOffDto, @Request() req: any) {
    return this.mantecaOperationsService.rampOff(
      dto,
      req.user.id,
      req.user.defaultUserIdentityId,
    );
  }

  @Get('synthetic/:id')
  @ApiOperation({ summary: 'Get synthetic operation status' })
  @ApiParam({ name: 'id', description: 'Synthetic/Operation ID' })
  @ApiResponse({
    status: 200,
    description: 'Synthetic operation status',
    type: SyntheticStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Operation not found' })
  async getSynthetic(@Param('id') id: string) {
    return this.mantecaOperationsService.getSyntheticById(id);
  }

  @Get('operations')
  @ApiOperation({ summary: 'Get user ramp operations' })
  @ApiResponse({ status: 200, description: 'User ramp operations list' })
  async getUserOperations(@Request() req: any) {
    return this.mantecaOperationsService.getUserRampOperations(req.user.id);
  }
}
