import { Injectable } from '@nestjs/common';
import {
  ErrorCodes,
  ErrorHelper,
} from '../../../../../shared/errors/app-error';
import { ColoredLogger } from '../../../../../shared/utils/logger-colors';
import { CreateBoletoCronosDto } from '../dto/create-boleto-cronos.dto';
import { BoletoCronosValidationService } from './boleto-cronos-validation.service';
import { BoletoCronosTransactionModel } from '../models/boleto-cronos-transaction.model';

@Injectable()
export class BoletoCronosService {
  constructor(
    private transactionModel: BoletoCronosTransactionModel,
    private validationService: BoletoCronosValidationService,
  ) {}

  async validateTransaction(userId: string, dto: CreateBoletoCronosDto) {
    try {
      if (dto.amount === undefined || dto.amount === null) {
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_AMOUNT,
          'amount is required to validate boleto limits',
        );
      }

      const { identity } = await this.transactionModel.findSourceAccount(
        userId,
        dto.sourceAccountId,
      );

      if (!identity || !identity.id) {
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_IDENTITY,
        );
      }

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

      return { valid: true };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[BoletoCronosService] ❌ ERRO CRÍTICO',
        'Erro ao validar boleto Cronos',
        error,
      );
      throw error;
    }
  }

  async createTransaction(userId: string, dto: CreateBoletoCronosDto) {
    try {
      if (dto.amount === undefined || dto.amount === null) {
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_AMOUNT,
          'amount is required to create boleto transaction',
        );
      }

      const { identity } = await this.transactionModel.findSourceAccount(
        userId,
        dto.sourceAccountId,
      );

      if (!identity || !identity.id) {
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_IDENTITY,
        );
      }

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

      const transaction = await this.transactionModel.createWithLock({
        userId,
        amount: dto.amount,
        sourceAccountId: dto.sourceAccountId,
        sourceIdentityId: identity.id,
        sourceTaxDocumentNumber: identity.taxDocumentNumber || '',
        barcode: dto.barcode,
        description: dto.description,
        idempotencyKey: dto.idempotencyKey,
      });

      return {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount ? Number(transaction.amount) : 0,
        createdAt: transaction.createdAt,
      };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[BoletoCronosService] ❌ ERRO CRÍTICO',
        'Erro ao criar boleto Cronos',
        error,
      );
      throw error;
    }
  }

  async confirmTransaction(userId: string, transactionId: string) {
    try {
      const transaction = await this.transactionModel.findPendingById(
        transactionId,
        userId,
      );

      if (!transaction) {
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_STATUS_PENDING,
        );
      }

      await this.transactionModel.updateStatus(transaction.id, 'process');

      return {
        id: transaction.id,
        status: 'process',
      };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[BoletoCronosService] ❌ ERRO CRÍTICO',
        'Erro ao confirmar boleto Cronos',
        error,
      );
      throw error;
    }
  }
}
