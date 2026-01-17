import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { BilletCronosService } from '../services/billet-cronos.service';
import { CreateBilletCronosDto } from '../dto/create-billet-cronos.dto';
import { ConfirmBilletCronosDto } from '../dto/confirm-billet-cronos.dto';
import { SuccessCodes } from '../../../../shared/errors/app-error';
import { LoggerService } from '../../../../shared/logger/logger.service';
import type { CurrentUserPayloadDto } from '../../../../common/dto';

@ApiTags('2.1 Secure - Transactions')
@Controller('transactions/billet/cronos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class BilletCronosController {
  constructor(
    private billetCronosService: BilletCronosService,
    private logger: LoggerService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Billet Cronos transaction',
    description:
      'Creates a new billet payment transaction. Validates the barcode and fetches beneficiary information from Cronos API.',
  })
  @ApiHeader({
    name: 'X-Idempotency-Key',
    description: 'Unique key to ensure idempotent requests.',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: CreateBilletCronosDto })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-da-transacao' },
        status: { type: 'string', example: 'pending' },
        amount: { type: 'number', example: 150.0 },
        createdAt: { type: 'string', format: 'date-time' },
        barcode: { type: 'string', example: '23793.38128 60000.000003 00000.000400 1 84340000015000' },
        beneficiaryName: { type: 'string', example: 'EMPRESA XYZ LTDA' },
        beneficiaryDocument: { type: 'string', example: '12345678000190' },
        message: { type: 'string', example: '200 transactions.success.created' },
        code: { type: 'string', example: '200 transactions.success.created' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid barcode or source account' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async create(
    @CurrentUser() user: CurrentUserPayloadDto,
    @Body() dto: CreateBilletCronosDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    try {
      const transaction = await this.billetCronosService.createTransaction(
        user.id,
        dto,
        idempotencyKey,
      );

      return {
        ...transaction,
        message: SuccessCodes.TRANSACTIONS_CREATED,
        code: SuccessCodes.TRANSACTIONS_CREATED,
      };
    } catch (error) {
      this.logger.errorWithStack(
        '[BilletCronosController] CRITICAL',
        'Failed to create transaction',
        error,
      );
      throw error;
    }
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm Billet Cronos transaction',
    description:
      'Confirms a pending billet transaction and sends it for asynchronous processing via SQS.',
  })
  @ApiBody({ type: ConfirmBilletCronosDto })
  @ApiResponse({
    status: 200,
    description: 'Transaction confirmed and sent for processing',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-da-transacao' },
        status: { type: 'string', example: 'process' },
        message: { type: 'string', example: 'Transaction sent for processing' },
        code: { type: 'string', example: '200 transactions.success.confirmed' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Transaction not found or not pending' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async confirm(
    @CurrentUser() user: CurrentUserPayloadDto,
    @Body() dto: ConfirmBilletCronosDto,
  ) {
    try {
      const result = await this.billetCronosService.confirmTransaction(
        user.id,
        dto.transactionId,
        dto.transactionalPassword,
      );

      return {
        ...result,
        message: SuccessCodes.TRANSACTIONS_CONFIRMED,
        code: SuccessCodes.TRANSACTIONS_CONFIRMED,
      };
    } catch (error) {
      this.logger.errorWithStack(
        '[BilletCronosController] CRITICAL',
        'Failed to confirm transaction',
        error,
      );
      throw error;
    }
  }
}
