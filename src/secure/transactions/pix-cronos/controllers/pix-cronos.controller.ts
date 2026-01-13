import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { PixCronosService } from '../services/pix-cronos.service';
import { CreatePixCronosDto } from '../dto/create-pix-cronos.dto';
import { ConfirmPixCronosDto } from '../dto/confirm-pix-cronos.dto';
import { SuccessCodes } from '../../../../shared/errors/app-error';
import { LoggerService } from '../../../../shared/logger/logger.service';

interface CurrentUserPayload {
  userId: string;
  email: string;
  roleId: string;
}

@ApiTags('2. Secure - Transactions')
@Controller('transactions/pix/cronos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PixCronosController {
  constructor(
    private pixCronosService: PixCronosService,
    private logger: LoggerService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create PIX Cronos transaction',
    description:
      'Creates a new PIX transaction and fetches recipient information from the Cronos API. Returns recipient data (name, document, bank, account).',
  })
  @ApiBody({ type: CreatePixCronosDto })
  @ApiResponse({
    status: 200,
    description: 'Transaction created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-da-transacao' },
        status: { type: 'string', example: 'pending' },
        amount: { type: 'number', example: 100.5 },
        createdAt: { type: 'string', format: 'date-time' },
        targetName: { type: 'string', example: 'RECIPIENT NAME' },
        targetAlias: { type: 'string', example: 'cpf 12345678900' },
        targetTaxDocumentNumber: { type: 'string', example: '12345678900' },
        targetTaxDocumentType: { type: 'string', example: 'CPF' },
        targetBank: { type: 'string', example: 'Recipient Bank' },
        targetAccountNumber: {
          type: 'string',
          example: '{"bank":"001","agency":"0001","number":"12345"}',
        },
        message: {
          type: 'string',
          example: '200 transactions.success.created',
        },
        code: {
          type: 'string',
          example: '200 transactions.success.created',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or invalid source account',
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePixCronosDto,
  ) {
    try {
      const transaction = await this.pixCronosService.createTransaction(
        user.userId,
        dto,
      );

      return {
        ...transaction,
        message: SuccessCodes.TRANSACTIONS_CREATED,
        code: SuccessCodes.TRANSACTIONS_CREATED,
      };
    } catch (error) {
      this.logger.errorWithStack(
        '[PixCronosController] CRITICAL',
        'Failed to create transaction',
        error,
      );
      throw error;
    }
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm PIX Cronos transaction',
    description:
      'Confirms a pending PIX transaction and sends it for asynchronous processing via SQS.',
  })
  @ApiBody({ type: ConfirmPixCronosDto })
  @ApiResponse({
    status: 200,
    description: 'Transaction confirmed and sent for processing',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-da-transacao' },
        status: { type: 'string', example: 'process' },
        message: {
          type: 'string',
          example: 'Transaction sent for processing',
        },
        code: {
          type: 'string',
          example: '200 transactions.success.confirmed',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Transaction not found or not pending',
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async confirm(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ConfirmPixCronosDto,
  ) {
    try {
      const result = await this.pixCronosService.confirmTransaction(
        user.userId,
        dto.transactionId,
      );

      return {
        ...result,
        message: SuccessCodes.TRANSACTIONS_CONFIRMED,
        code: SuccessCodes.TRANSACTIONS_CONFIRMED,
      };
    } catch (error) {
      this.logger.errorWithStack(
        '[PixCronosController] CRITICAL',
        'Failed to confirm transaction',
        error,
      );
      throw error;
    }
  }
}
