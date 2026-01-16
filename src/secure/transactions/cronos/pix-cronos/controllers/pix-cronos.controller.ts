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
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../../shared/decorators/current-user.decorator';
import { PixCronosService } from '../services/pix-cronos.service';
import { CreatePixCronosDto } from '../dto/create-pix-cronos.dto';
import { ConfirmPixCronosDto } from '../dto/confirm-pix-cronos.dto';
import { SuccessCodes } from '../../../../../shared/errors/app-error';
import { ColoredLogger } from '../../../../../shared/utils/logger-colors';

interface CurrentUserPayload {
  userId: string;
  email: string;
  roleId: string;
}

/**
 * Controller para transações PIX Cronos
 */
@ApiTags('transactions')
@Controller('transactions/pix/cronos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PixCronosController {
  constructor(private pixCronosService: PixCronosService) {}

  @Post('create')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requisições por minuto
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Criar transação PIX Cronos',
    description:
      'Cria uma nova transação PIX e busca informações do destinatário na API da Cronos. Retorna dados do destinatário (nome, documento, banco, conta).',
  })
  @ApiBody({ type: CreatePixCronosDto })
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
        targetName: { type: 'string', example: 'NOME DO DESTINATÁRIO' },
        targetAlias: { type: 'string', example: 'cpf 12345678900' },
        targetTaxDocumentNumber: { type: 'string', example: '12345678900' },
        targetTaxDocumentType: { type: 'string', example: 'CPF' },
        targetBank: { type: 'string', example: 'Banco do Destinatário' },
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
    description: 'Dados inválidos ou conta de origem inválida',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
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
      ColoredLogger.errorWithStack(
        '[PixCronosController] ❌ ERRO CRÍTICO',
        'Erro ao criar transação',
        error,
      );
      throw error;
    }
  }

  @Post('confirm')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requisições por minuto
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmar transação PIX Cronos',
    description:
      'Confirma uma transação PIX pendente e envia para processamento assíncrono via SQS.',
  })
  @ApiBody({ type: ConfirmPixCronosDto })
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
          example: 'Transação enviada para processamento',
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
  @ApiResponse({ status: 401, description: 'Não autenticado' })
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
      ColoredLogger.errorWithStack(
        '[PixCronosController] ❌ ERRO CRÍTICO',
        'Erro ao confirmar transação',
        error,
      );
      throw error;
    }
  }
}
