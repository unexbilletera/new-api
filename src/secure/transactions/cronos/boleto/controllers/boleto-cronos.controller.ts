import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../../shared/decorators/current-user.decorator';
import { SuccessCodes } from '../../../../../shared/errors/app-error';
import { ColoredLogger } from '../../../../../shared/utils/logger-colors';
import { CreateBoletoCronosDto } from '../dto/create-boleto-cronos.dto';
import { ConfirmBoletoCronosDto } from '../dto/confirm-boleto-cronos.dto';
import { BoletoCronosService } from '../services/boleto-cronos.service';

interface CurrentUserPayload {
  userId: string;
  email: string;
  roleId: string;
}

@ApiTags('transactions')
@Controller('transactions/boleto/cronos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class BoletoCronosController {
  constructor(private readonly boletoCronosService: BoletoCronosService) {}

  @Post('create')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Criar pagamento de boleto Cronos',
    description:
      'Cria uma transação de pagamento de boleto e reserva saldo.',
  })
  @ApiBody({ type: CreateBoletoCronosDto })
  @ApiResponse({
    status: 200,
    description: 'Transação criada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-da-transacao' },
        status: { type: 'string', example: 'pending' },
        amount: { type: 'number', example: 100.5 },
        createdAt: { type: 'string', format: 'date-time' },
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
    description: 'Dados inválidos ou conta de origem inválida',
  })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateBoletoCronosDto,
  ) {
    try {
      const transaction = await this.boletoCronosService.createTransaction(
        user.userId,
        dto,
      );

      return {
        ...transaction,
        message: SuccessCodes.TRANSACTIONS_CREATED,
        code: SuccessCodes.TRANSACTIONS_CREATED,
      };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[BoletoCronosController] ❌ ERRO CRÍTICO',
        'Erro ao criar boleto Cronos',
        error,
      );
      throw error;
    }
  }

  @Post('validate')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar limites de boleto Cronos',
    description:
      'Valida saldo e limites diários/por transação antes de criar o pagamento.',
  })
  @ApiBody({ type: CreateBoletoCronosDto })
  @ApiResponse({
    status: 200,
    description: 'Validação concluída com sucesso',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: '200 server.success.operationSuccess',
        },
        code: {
          type: 'string',
          example: '200 server.success.operationSuccess',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Limites excedidos ou dados inválidos',
  })
  async validate(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateBoletoCronosDto,
  ) {
    try {
      const result = await this.boletoCronosService.validateTransaction(
        user.userId,
        dto,
      );

      return {
        ...result,
        message: SuccessCodes.OPERATION_SUCCESS,
        code: SuccessCodes.OPERATION_SUCCESS,
      };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[BoletoCronosController] ❌ ERRO CRÍTICO',
        'Erro ao validar boleto Cronos',
        error,
      );
      throw error;
    }
  }

  @Post('confirm')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmar pagamento de boleto Cronos',
    description:
      'Confirma uma transação pendente e envia para processamento.',
  })
  @ApiBody({ type: ConfirmBoletoCronosDto })
  @ApiResponse({
    status: 200,
    description: 'Transação confirmada e enviada para processamento',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-da-transacao' },
        status: { type: 'string', example: 'process' },
        message: {
          type: 'string',
          example: '200 transactions.success.confirmed',
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
    description: 'Transação não encontrada ou não está pendente',
  })
  async confirm(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ConfirmBoletoCronosDto,
  ) {
    try {
      const result = await this.boletoCronosService.confirmTransaction(
        user.userId,
        dto.transactionId,
      );

      return {
        ...result,
        message: SuccessCodes.TRANSACTIONS_CONFIRMED,
        code: SuccessCodes.TRANSACTIONS_CONFIRMED,
      };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[BoletoCronosController] ❌ ERRO CRÍTICO',
        'Erro ao confirmar boleto Cronos',
        error,
      );
      throw error;
    }
  }
}
