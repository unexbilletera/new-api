/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { SqsService } from '../../../../../shared/sqs/sqs.service';
import { CronosService } from '../../../../../shared/cronos/cronos.service';
import { PixCronosTransactionModel } from '../models/pix-cronos-transaction.model';
import { CreatePixCronosDto } from '../dto/create-pix-cronos.dto';
import {
  ErrorCodes,
  ErrorHelper,
} from '../../../../../shared/errors/app-error';
import { ColoredLogger } from '../../../../../shared/utils/logger-colors';
import { PixKeyValidator } from '../../../../../shared/validators/pix-key.validator';
import { PixKeyType } from '../dto/create-pix-cronos.dto';
import { PixCronosValidationService } from './pix-cronos-validation.service';

@Injectable()
export class PixCronosService {
  constructor(
    private transactionModel: PixCronosTransactionModel,
    private sqsService: SqsService,
    private cronosService: CronosService,
    private validationService: PixCronosValidationService,
  ) {}

  /**
   * Cria uma transação PIX Cronos
   * Busca informações do destinatário na API da Cronos e salva a transação como 'pending'
   * O envio para SQS só acontece quando o usuário confirmar através do endpoint /confirm
   *
   * Fluxo: Service => Model (criar) => Controller
   */
  async createTransaction(
    userId: string,
    dto: CreatePixCronosDto,
  ): Promise<{
    id: string;
    status: string;
    amount: number;
    createdAt: Date;
    targetName?: string;
    targetAlias?: string;
    targetTaxDocumentNumber?: string;
    targetTaxDocumentType?: string;
    targetBank?: string;
    targetAccountNumber?: string;
  }> {
    try {
      // 1. Validar conta de origem (usa Model)
      const { identity } = await this.transactionModel.findSourceAccount(
        userId,
        dto.sourceAccountId,
      );

      // Garantir que identity não é null (já validado no Model, mas TypeScript precisa de confirmação)
      if (!identity || !identity.id) {
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_IDENTITY,
        );
      }

      // 2. Validar formato da chave PIX (camada dupla de segurança)
      // A validação também é feita no DTO, mas validamos novamente aqui para garantir
      const isValidKey = PixKeyValidator.validate(
        dto.targetKeyType,
        dto.targetKeyValue,
      );

      if (!isValidKey) {
        // Retornar erro específico baseado no tipo de chave
        const keyType = dto.targetKeyType;
        const errorCodeMap: Record<PixKeyType, ErrorCodes> = {
          [PixKeyType.CPF]: ErrorCodes.TRANSACTIONS_INVALID_PIX_KEY_CPF,
          [PixKeyType.CNPJ]: ErrorCodes.TRANSACTIONS_INVALID_PIX_KEY_CNPJ,
          [PixKeyType.EMAIL]: ErrorCodes.TRANSACTIONS_INVALID_PIX_KEY_EMAIL,
          [PixKeyType.PHONE]: ErrorCodes.TRANSACTIONS_INVALID_PIX_KEY_PHONE,
          [PixKeyType.EVP]: ErrorCodes.TRANSACTIONS_INVALID_PIX_KEY_EVP,
        };

        const errorCode =
          (errorCodeMap[keyType] as string) ||
          ErrorCodes.TRANSACTIONS_INVALID_TARGET_USER_ACCOUNT;

        throw ErrorHelper.badRequest(errorCode);
      }

      // 3. Validação prévia de saldo (considerando transações pendentes)
      // Isso evita chamadas desnecessárias à API Cronos
      const balanceValidation = await this.validationService.validateBalance(
        dto.sourceAccountId,
        dto.amount,
        userId,
      );

      if (!balanceValidation.valid) {
        throw ErrorHelper.badRequest(
          (balanceValidation.errorCode as ErrorCodes) ||
            ErrorCodes.TRANSACTIONS_INSUFFICIENT_BALANCE,
          balanceValidation.error,
        );
      }

      // 4. Validar limite máximo por transação (usa spending_limit_profiles)
      const maxAmountValidation =
        await this.validationService.validateMaxAmountPerTransaction(
          identity.id,
          dto.amount,
        );

      if (!maxAmountValidation.valid) {
        throw ErrorHelper.badRequest(
          (maxAmountValidation.errorCode as ErrorCodes) ||
            ErrorCodes.TRANSACTIONS_MAX_AMOUNT_PER_TRANSACTION_EXCEEDED,
          maxAmountValidation.error,
        );
      }

      // 5. Validar limite diário por valor (antes de chamar a Cronos)
      // Usa transactionId vazio pois ainda não criamos a transação
      const dailyLimitValidation =
        await this.validationService.validateDailyLimit(
          identity.id,
          userId,
          dto.sourceAccountId,
          dto.amount,
          '',
        );

      if (!dailyLimitValidation.valid) {
        throw ErrorHelper.badRequest(
          (dailyLimitValidation.errorCode as ErrorCodes) ||
            ErrorCodes.TRANSACTIONS_MAX_AMOUNT_PER_DAY_EXCEEDED,
          dailyLimitValidation.error,
        );
      }

      // 6. Validar limite diário por quantidade (antes de chamar a Cronos)
      const countDailyValidation =
        await this.validationService.validateTransactionCountDaily(
          identity.id,
          userId,
          dto.sourceAccountId,
          '',
        );

      if (!countDailyValidation.valid) {
        throw ErrorHelper.badRequest(
          (countDailyValidation.errorCode as ErrorCodes) ||
            ErrorCodes.TRANSACTIONS_MAX_COUNT_PER_DAY_EXCEEDED,
          countDailyValidation.error,
        );
      }

      // 7. Criar transação no banco com proteções de segurança:
      // - Lock transacional (SELECT FOR UPDATE)
      // - Validação de saldo disponível (balance - pending)
      // - Validação de duplicidade (idempotencyKey + chave PIX + amount)
      // - Cancelamento automático de pending antigas
      // Tudo dentro de uma transação atômica
      const transaction = await this.transactionModel.createWithLock({
        userId,
        amount: dto.amount,
        sourceAccountId: dto.sourceAccountId,
        sourceIdentityId: identity.id,
        sourceTaxDocumentNumber: identity.taxDocumentNumber || '',
        targetKeyType: dto.targetKeyType,
        targetKeyValue: dto.targetKeyValue,
        description: dto.description,
        idempotencyKey: dto.idempotencyKey,
      });

      // 8. Buscar informações do destinatário na API da Cronos
      // Só chamamos a API depois de validar saldo e limites
      let targetInfo: {
        targetName?: string;
        targetAlias?: string;
        targetTaxDocumentNumber?: string;
        targetTaxDocumentType?: string;
        targetBank?: string;
        targetAccountNumber?: string;
        cronosId?: string;
      } = {};

      try {
        const cronosResponse = await this.cronosService.transferPix({
          document: identity.taxDocumentNumber || '',
          keyType: dto.targetKeyType,
          keyValue: dto.targetKeyValue,
        });

        if (cronosResponse && cronosResponse.recebedor) {
          const recebedor = cronosResponse.recebedor;
          targetInfo = {
            targetName: recebedor.pessoa.nome.toUpperCase(),
            targetTaxDocumentType: recebedor.pessoa.tipoDocumento,
            targetTaxDocumentNumber: recebedor.pessoa.documento,
            targetAlias: `${dto.targetKeyType} ${dto.targetKeyValue}`,
            targetBank: recebedor.conta.bancoNome,
            targetAccountNumber: JSON.stringify({
              bank: recebedor.conta.banco,
              agency: recebedor.conta.agencia,
              number: recebedor.conta.numero,
            }),
            cronosId: cronosResponse.id_pagamento,
          };
        }

        await this.transactionModel.updateTargetInfo(
          transaction.id,
          targetInfo,
        );
      } catch (error) {
        // Se falhar ao buscar informações do destinatário, marcar como erro
        ColoredLogger.errorWithStack(
          '[PixCronosService] ❌ ERRO CRÍTICO',
          'Erro ao buscar informações do destinatário na API da Cronos',
          error,
        );
        await this.transactionModel.updateStatus(transaction.id, 'error');
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_TARGET_USER_ACCOUNT,
          'Erro ao buscar informações do destinatário na API da Cronos',
        );
      }

      const response = {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount ? Number(transaction.amount) : 0,
        createdAt: transaction.createdAt,
        targetName:
          targetInfo.targetName || transaction.targetName || undefined,
        targetAlias:
          targetInfo.targetAlias || transaction.targetAlias || undefined,
        targetTaxDocumentNumber:
          targetInfo.targetTaxDocumentNumber ||
          transaction.targetTaxDocumentNumber ||
          undefined,
        targetTaxDocumentType:
          targetInfo.targetTaxDocumentType ||
          transaction.targetTaxDocumentType ||
          undefined,
        targetBank:
          targetInfo.targetBank || transaction.targetBank || undefined,
        targetAccountNumber:
          targetInfo.targetAccountNumber ||
          transaction.targetAccountNumber ||
          undefined,
      };

      return response;
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[PixCronosService] ❌ ERRO CRÍTICO',
        'Erro ao criar transação PIX',
        error,
      );
      throw error;
    }
  }

  async confirmTransaction(
    userId: string,
    transactionId: string,
  ): Promise<{
    id: string;
    status: string;
    message: string;
  }> {
    try {
      // 1. Buscar transação (verificar se existe e qual o status)
      const transaction = await this.transactionModel.findById(
        transactionId,
        userId,
      );

      // 2. Verificar se já foi confirmada/processada (evitar confirmação duplicada)
      if (transaction.status === 'confirm') {
        ColoredLogger.warning(
          '[PixCronosService] ⚠️',
          `Tentativa de confirmar transação já confirmada - transactionId: ${transactionId}, status: ${transaction.status}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_DUPLICATE_TRANSACTION,
          'Esta transação já foi confirmada anteriormente.',
        );
      }

      if (transaction.status === 'process') {
        ColoredLogger.warning(
          '[PixCronosService] ⚠️',
          `Tentativa de confirmar transação já em processamento - transactionId: ${transactionId}, status: ${transaction.status}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_DUPLICATE_TRANSACTION,
          'Esta transação já está em processamento.',
        );
      }

      // 3. Verificar se está em status 'pending' (único status válido para confirmação)
      if (transaction.status !== 'pending') {
        ColoredLogger.error(
          '[PixCronosService] ❌',
          `Tentativa de confirmar transação com status inválido - transactionId: ${transactionId}, status: ${transaction.status}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_ID,
          `Transação não pode ser confirmada. Status atual: ${transaction.status}`,
        );
      }

      // 4. Atualizar status para 'process' (aguardando processamento) (usa Model)
      await this.transactionModel.updateStatus(transaction.id, 'process');

      // 5. Enviar mensagem para SQS para processamento assíncrono (lógica de negócio)
      try {
        await this.sqsService.sendTransactionMessage('pix_cronos_confirm', {
          transactionId: transactionId,
          userId: userId,
        });
      } catch (error) {
        // Se falhar ao enviar para SQS, reverter status para 'pending' (usa Model)
        ColoredLogger.errorWithStack(
          '[PixCronosService] ❌ ERRO CRÍTICO',
          'Erro ao enviar confirmação para SQS',
          error,
        );

        await this.transactionModel.updateStatus(transactionId, 'pending');

        throw ErrorHelper.internalServerError(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Erro ao enviar confirmação para processamento',
        );
      }

      return {
        id: transactionId,
        status: 'process',
        message: 'Transação enviada para processamento',
      };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[PixCronosService] ❌ ERRO CRÍTICO',
        'Erro ao confirmar transação PIX',
        error,
      );
      throw error;
    }
  }
}
