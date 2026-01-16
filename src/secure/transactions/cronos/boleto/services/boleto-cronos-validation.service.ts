import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/prisma/prisma.service';
import { ColoredLogger } from '../../../../../shared/utils/logger-colors';
import { ErrorCodes } from '../../../../../shared/errors/error-codes';

interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: ErrorCodes;
}

interface SpendingLimits {
  maxDaily?: number;
  maxPerTransaction?: number;
  maxCountDaily?: number;
}

type LimitsConfig = {
  boleto?: {
    maxDaily?: number;
    maxPerTransaction?: number;
    maxCountDaily?: number;
  };
};

@Injectable()
export class BoletoCronosValidationService {
  constructor(private prisma: PrismaService) {}

  async validateBalance(
    accountId: string,
    amount: number,
    userId?: string,
  ): Promise<ValidationResult> {
    try {
      const account = await this.prisma.usersAccounts.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        return {
          valid: false,
          error: 'Conta de origem não encontrada',
          errorCode: ErrorCodes.TRANSACTIONS_INVALID_SOURCE_ACCOUNT,
        };
      }

      const currentBalance = Number(account.balance ?? 0);
      const transactionAmount = Number(amount);

      if (Number.isNaN(currentBalance) || Number.isNaN(transactionAmount)) {
        return {
          valid: false,
          error: 'Saldo ou valor da transação inválidos',
          errorCode: ErrorCodes.TRANSACTIONS_INVALID_AMOUNT,
        };
      }

      let availableBalance = currentBalance;
      if (userId) {
        const pendingSum = await this.prisma.transactions.aggregate({
          where: {
            userId,
            sourceAccountId: accountId,
            status: 'pending',
          },
          _sum: {
            amount: true,
          },
        });

        const reservedAmount = Number(pendingSum._sum.amount ?? 0);
        availableBalance = currentBalance - reservedAmount;

        ColoredLogger.info(
          '[BoletoCronosValidationService]',
          `Validação de saldo - balance: ${currentBalance.toFixed(2)}, reserved: ${reservedAmount.toFixed(2)}, available: ${availableBalance.toFixed(2)}, required: ${transactionAmount.toFixed(2)}`,
        );
      }

      if (availableBalance < transactionAmount) {
        return {
          valid: false,
          error: `Saldo insuficiente. Saldo disponível: ${availableBalance.toFixed(2)}, Valor necessário: ${transactionAmount.toFixed(2)}`,
          errorCode: ErrorCodes.TRANSACTIONS_INSUFFICIENT_BALANCE,
        };
      }

      return { valid: true };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[BoletoCronosValidationService] ❌ ERRO CRÍTICO',
        'Erro ao validar saldo',
        error,
      );
      return {
        valid: false,
        error: 'Erro ao validar saldo',
        errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }

  private async getSpendingLimits(
    sourceIdentityId: string,
  ): Promise<SpendingLimits | null> {
    try {
      const identityLimits =
        await this.prisma.user_identity_spending_limits.findFirst({
          where: {
            userIdentityId: sourceIdentityId,
            deletedAt: null,
          },
        });

      if (!identityLimits) {
        return null;
      }

      const parseLimits = (value: unknown): LimitsConfig | null => {
        if (!value) return null;
        if (typeof value === 'string') {
          try {
            return JSON.parse(value) as LimitsConfig;
          } catch {
            ColoredLogger.warning(
              '[BoletoCronosValidationService]',
              'Falha ao fazer parse de limits (string inválida)',
            );
            return null;
          }
        }
        return value as LimitsConfig;
      };

      const resolveLimitsForCountry = (
        country: string | undefined,
        limitsArRaw: unknown,
        limitsBrRaw: unknown,
      ): SpendingLimits | null => {
        const limitsAr = parseLimits(limitsArRaw);
        const limitsBr = parseLimits(limitsBrRaw);

        const pickLimits = (config: LimitsConfig | null): SpendingLimits | null => {
          if (!config || !config.boleto) return null;
          const boleto = config.boleto;
          return {
            maxDaily: boleto.maxDaily,
            maxPerTransaction: boleto.maxPerTransaction,
            maxCountDaily: boleto.maxCountDaily,
          };
        };

        if (country === 'ar' && limitsAr) {
          return pickLimits(limitsAr);
        }

        if (country === 'br' && limitsBr) {
          return pickLimits(limitsBr);
        }

        return null;
      };

      if (identityLimits.isCustom) {
        const identity = await this.prisma.usersIdentities.findUnique({
          where: { id: sourceIdentityId },
          select: { country: true },
        });

        return resolveLimitsForCountry(
          identity?.country,
          identityLimits.limitsAr,
          identityLimits.limitsBr,
        );
      }

      if (identityLimits.profileId) {
        const profile = await this.prisma.spending_limit_profiles.findUnique({
          where: { id: identityLimits.profileId },
        });

        if (!profile) {
          return null;
        }

        const identity = await this.prisma.usersIdentities.findUnique({
          where: { id: sourceIdentityId },
          select: { country: true },
        });

        return resolveLimitsForCountry(
          identity?.country,
          profile.limitsAr,
          profile.limitsBr,
        );
      }

      return null;
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[BoletoCronosValidationService] ❌ ERRO CRÍTICO',
        'Erro ao buscar limites de spending',
        error,
      );
      return null;
    }
  }

  async validateMaxAmountPerTransaction(
    sourceIdentityId: string,
    amount: number,
  ): Promise<ValidationResult> {
    try {
      const limits = await this.getSpendingLimits(sourceIdentityId);

      if (!limits || !limits.maxPerTransaction) {
        return { valid: true };
      }

      const transactionAmount = Number(amount);

      if (Number.isNaN(transactionAmount)) {
        return {
          valid: false,
          error: 'Valor da transação inválido',
          errorCode: ErrorCodes.TRANSACTIONS_INVALID_AMOUNT,
        };
      }

      if (transactionAmount > limits.maxPerTransaction) {
        return {
          valid: false,
          error: `Valor excede o limite máximo por transação. Limite: ${limits.maxPerTransaction.toFixed(2)}, Valor: ${transactionAmount.toFixed(2)}`,
          errorCode:
            ErrorCodes.TRANSACTIONS_MAX_AMOUNT_PER_TRANSACTION_EXCEEDED,
        };
      }

      return { valid: true };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[BoletoCronosValidationService] ❌ ERRO CRÍTICO',
        'Erro ao validar limite máximo por transação',
        error,
      );
      return {
        valid: false,
        error: 'Erro ao validar limite máximo por transação',
        errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async validateDailyLimit(
    sourceIdentityId: string,
    userId: string,
    accountId: string,
    amount: number,
    transactionId: string,
  ): Promise<ValidationResult> {
    try {
      const limits = await this.getSpendingLimits(sourceIdentityId);

      if (!limits || !limits.maxDaily) {
        return { valid: true };
      }

      const maxDailyAmount = limits.maxDaily;
      const transactionAmount = Number(amount);

      if (Number.isNaN(transactionAmount)) {
        return {
          valid: false,
          error: 'Valor da transação inválido',
          errorCode: ErrorCodes.TRANSACTIONS_INVALID_AMOUNT,
        };
      }

      const now = new Date();
      const startOfDay = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          0,
          0,
          0,
          0,
        ),
      );
      const endOfDay = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          23,
          59,
          59,
          999,
        ),
      );

      const dailySum = await this.prisma.transactions.aggregate({
        where: {
          userId,
          sourceAccountId: accountId,
          type: 'payment_cronos',
          status: { in: ['pending', 'process', 'confirm'] },
          date: { gte: startOfDay, lte: endOfDay },
          id: { not: transactionId === '' ? undefined : transactionId },
        },
        _sum: {
          amount: true,
        },
      });

      const totalSpentToday = Number(dailySum._sum.amount ?? 0);

      if (totalSpentToday + transactionAmount > maxDailyAmount) {
        return {
          valid: false,
          error: `Valor excede o limite diário. Limite: ${maxDailyAmount.toFixed(2)}, Já utilizado: ${totalSpentToday.toFixed(2)}, Valor atual: ${transactionAmount.toFixed(2)}`,
          errorCode: ErrorCodes.TRANSACTIONS_MAX_AMOUNT_PER_DAY_EXCEEDED,
        };
      }

      return { valid: true };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[BoletoCronosValidationService] ❌ ERRO CRÍTICO',
        'Erro ao validar limite diário por valor',
        error,
      );
      return {
        valid: false,
        error: 'Erro ao validar limite diário por valor',
        errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async validateTransactionCountDaily(
    sourceIdentityId: string,
    userId: string,
    accountId: string,
    transactionId: string,
  ): Promise<ValidationResult> {
    try {
      const limits = await this.getSpendingLimits(sourceIdentityId);

      if (!limits || !limits.maxCountDaily) {
        return { valid: true };
      }

      const now = new Date();
      const startOfDay = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          0,
          0,
          0,
          0,
        ),
      );
      const endOfDay = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          23,
          59,
          59,
          999,
        ),
      );

      const dailyCount = await this.prisma.transactions.count({
        where: {
          userId,
          sourceAccountId: accountId,
          type: 'payment_cronos',
          status: { in: ['pending', 'process', 'confirm'] },
          date: { gte: startOfDay, lte: endOfDay },
          id: { not: transactionId === '' ? undefined : transactionId },
        },
      });

      if (dailyCount >= limits.maxCountDaily) {
        return {
          valid: false,
          error: `Limite de transações diárias excedido. Limite: ${limits.maxCountDaily}, Já utilizadas: ${dailyCount}`,
          errorCode: ErrorCodes.TRANSACTIONS_MAX_COUNT_PER_DAY_EXCEEDED,
        };
      }

      return { valid: true };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[BoletoCronosValidationService] ❌ ERRO CRÍTICO',
        'Erro ao validar limite de quantidade diária',
        error,
      );
      return {
        valid: false,
        error: 'Erro ao validar limite de quantidade diária',
        errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }
}
