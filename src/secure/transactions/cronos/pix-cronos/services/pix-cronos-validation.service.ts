import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/prisma/prisma.service';
import { ColoredLogger } from '../../../../../shared/utils/logger-colors';
import { ErrorCodes } from '../../../../../shared/errors/error-codes';
import type { transactions_status } from '../../../../../../generated/prisma';

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
  pix?: {
    maxDaily?: number;
    maxDailyQrCodeAr?: number;
    maxPerTransaction?: number;
    maxCountDaily?: number;
  };
  qrCode?: {
    maxDaily?: number;
    maxPerTransaction?: number;
    maxCountDaily?: number;
  };
  transfer?: {
    maxDaily?: number;
    maxMonthly?: number;
    maxPerTransaction?: number;
    maxCountDaily?: number;
  };
};

/**
 * Service para validações de segurança de transações PIX Cronos
 * Valida: saldo suficiente, limite por transação, limite diário
 * Usa limites de spending_limit_profiles e user_identity_spending_limits
 */
@Injectable()
export class PixCronosValidationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Valida se a conta tem saldo suficiente para a transação
   * Considera transações pendentes para calcular saldo disponível
   */
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

      // Se userId foi fornecido, considerar TODAS as transações pendentes que debitam da conta
      // Não apenas cashout_cronos, mas qualquer transação com sourceAccountId
      // IMPORTANTE: Cancelar transações cashout_cronos pendentes antigas antes de calcular saldo
      let availableBalance = currentBalance;
      if (userId) {
        // Cancelar transações cashout_cronos pendentes antigas (mesma lógica do createWithLock)
        // Isso libera o saldo reservado por transações abandonadas
        const cancelledCount = await this.prisma.transactions.updateMany({
          where: {
            userId: userId,
            sourceAccountId: accountId,
            type: 'cashout_cronos',
            status: 'pending',
          },
          data: {
            status: 'error' as transactions_status,
            reason: 'Cancelled by new transaction',
            updatedAt: new Date(),
          },
        });

        if (cancelledCount.count > 0) {
          ColoredLogger.info(
            '[PixCronosValidationService]',
            `Canceladas ${cancelledCount.count} transações cashout_cronos pending antigas na validação prévia - userId: ${userId}, accountId: ${accountId}`,
          );
        }

        // Agora calcular saldo disponível considerando TODAS as transações pending restantes
        const pendingSum = await this.prisma.transactions.aggregate({
          where: {
            userId: userId,
            sourceAccountId: accountId,
            status: 'pending',
            // Considerar TODAS as transações que debitam (têm sourceAccountId)
            // Não filtrar por tipo, pois qualquer transação pending reserva saldo
          },
          _sum: {
            amount: true,
          },
        });

        const reservedAmount = Number(pendingSum._sum.amount ?? 0);
        availableBalance = currentBalance - reservedAmount;

        ColoredLogger.info(
          '[PixCronosValidationService]',
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
        '[PixCronosValidationService] ❌ ERRO CRÍTICO',
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

  /**
   * Busca os limites de spending da identidade do usuário
   * Retorna limites do perfil ou limites customizados da identidade
   */
  private async getSpendingLimits(
    sourceIdentityId: string,
  ): Promise<SpendingLimits | null> {
    try {
      // Buscar limites da identidade
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
              '[PixCronosValidationService]',
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

        const pickMinDefined = (
          values: Array<number | undefined>,
        ): number | undefined => {
          const defined = values.filter(
            (value): value is number =>
              value !== undefined && !Number.isNaN(value),
          );
          if (defined.length === 0) {
            return undefined;
          }
          return Math.min(...defined);
        };

        const pickLimits = (
          config: LimitsConfig | null,
        ): SpendingLimits | null => {
          if (!config) return null;

          // Para PIX Cronos, aplicar o limite mais restritivo disponível
          const qrCode = config.qrCode || {};
          const transfer = config.transfer || {};
          const pix = config.pix || {};

          return {
            maxDaily: pickMinDefined([
              qrCode.maxDaily,
              transfer.maxDaily,
              pix.maxDailyQrCodeAr,
              pix.maxDaily,
            ]),
            maxPerTransaction: pickMinDefined([
              qrCode.maxPerTransaction,
              transfer.maxPerTransaction,
              pix.maxPerTransaction,
            ]),
            maxCountDaily: pickMinDefined([
              qrCode.maxCountDaily,
              transfer.maxCountDaily,
              pix.maxCountDaily,
            ]),
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

      // Se for customizado, usar limites diretos
      if (identityLimits.isCustom) {
        // Buscar país da identidade para saber qual limite usar
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

      // Se não for customizado e tiver profileId, buscar perfil
      if (identityLimits.profileId) {
        const profile = await this.prisma.spending_limit_profiles.findUnique({
          where: { id: identityLimits.profileId },
        });

        if (!profile) {
          return null;
        }

        // Buscar país da identidade para saber qual limite usar
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
        '[PixCronosValidationService] ❌ ERRO CRÍTICO',
        'Erro ao buscar limites de spending',
        error,
      );
      return null;
    }
  }

  /**
   * Valida se o valor da transação não excede o limite máximo por transação
   * Usa limites de spending_limit_profiles
   */
  async validateMaxAmountPerTransaction(
    sourceIdentityId: string,
    amount: number,
  ): Promise<ValidationResult> {
    try {
      const limits = await this.getSpendingLimits(sourceIdentityId);

      // Se não houver limite configurado, não valida (permite qualquer valor)
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
        '[PixCronosValidationService] ❌ ERRO CRÍTICO',
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

  /**
   * Valida se o valor da transação não excede o limite diário
   * Calcula o total de transações confirmadas/process do dia e adiciona o valor atual
   * Usa limites de spending_limit_profiles
   */
  async validateDailyLimit(
    sourceIdentityId: string,
    userId: string,
    accountId: string,
    amount: number,
    transactionId: string,
  ): Promise<ValidationResult> {
    try {
      const limits = await this.getSpendingLimits(sourceIdentityId);

      // Se não houver limite configurado, não valida (permite qualquer valor)
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

      // Calcular início e fim do dia atual (UTC)
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

      // Buscar total de transações do dia (excluindo a transação atual)
      const dailyTransactions = await this.prisma.transactions.aggregate({
        where: {
          userId: userId,
          sourceAccountId: accountId,
          type: 'cashout_cronos',
          status: { in: ['process', 'confirm'] },
          date: { gte: startOfDay, lte: endOfDay },
          id: { not: transactionId }, // Excluir a própria transação atual
        },
        _sum: {
          amount: true,
        },
      });

      const totalDailyAmount =
        Number(dailyTransactions._sum.amount ?? 0) + transactionAmount;

      if (totalDailyAmount > maxDailyAmount) {
        const alreadyUsed = Number(dailyTransactions._sum.amount ?? 0);
        return {
          valid: false,
          error: `Limite diário excedido. Limite: ${maxDailyAmount.toFixed(2)}, Já utilizado: ${alreadyUsed.toFixed(2)}, Tentativa: ${transactionAmount.toFixed(2)}, Total seria: ${totalDailyAmount.toFixed(2)}`,
          errorCode: ErrorCodes.TRANSACTIONS_MAX_AMOUNT_PER_DAY_EXCEEDED,
        };
      }

      return { valid: true };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[PixCronosValidationService] ❌ ERRO CRÍTICO',
        'Erro ao validar limite diário',
        error,
      );
      return {
        valid: false,
        error: 'Erro ao validar limite diário',
        errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }

  /**
   * Valida se a quantidade de transações do dia não excede o limite
   * Usa limites de spending_limit_profiles (maxCountDaily)
   */
  async validateTransactionCountDaily(
    sourceIdentityId: string,
    userId: string,
    accountId: string,
    transactionId: string,
  ): Promise<ValidationResult> {
    try {
      const limits = await this.getSpendingLimits(sourceIdentityId);

      // Se não houver limite configurado, não valida (permite qualquer quantidade)
      if (!limits || !limits.maxCountDaily) {
        return { valid: true };
      }

      // Calcular início e fim do dia atual (UTC)
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

      // Contar transações do dia (excluindo a transação atual)
      const dailyCount = await this.prisma.transactions.count({
        where: {
          userId: userId,
          sourceAccountId: accountId,
          type: 'cashout_cronos',
          status: { in: ['pending', 'process', 'confirm'] },
          date: { gte: startOfDay, lte: endOfDay },
          id: { not: transactionId }, // Excluir a própria transação atual
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
        '[PixCronosValidationService] ❌ ERRO CRÍTICO',
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

  /**
   * Valida velocidade de transações (anti-fraude)
   * Bloqueia se houver muitas transações criadas em pouco tempo
   */
  async validateTransactionVelocity(
    userId: string,
    accountId: string,
  ): Promise<ValidationResult> {
    try {
      // Buscar transações criadas nos últimos 60 segundos
      const oneMinuteAgo = new Date(Date.now() - 60000);

      const recentCount = await this.prisma.transactions.count({
        where: {
          userId: userId,
          sourceAccountId: accountId,
          type: 'cashout_cronos',
          status: { in: ['pending', 'process', 'confirm'] },
          createdAt: { gte: oneMinuteAgo },
        },
      });

      // Se tiver 3 ou mais transações em 1 minuto, bloquear (possível fraude/bot)
      const maxTransactionsPerMinute = 3;

      if (recentCount >= maxTransactionsPerMinute) {
        return {
          valid: false,
          error: `Muitas transações em pouco tempo. Aguarde alguns minutos antes de tentar novamente. (${recentCount} transações nos últimos 60 segundos)`,
          errorCode: ErrorCodes.TRANSACTIONS_VELOCITY_LIMIT_EXCEEDED,
        };
      }

      return { valid: true };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[PixCronosValidationService] ❌ ERRO CRÍTICO',
        'Erro ao validar velocidade de transações',
        error,
      );
      return {
        valid: false,
        error: 'Erro ao validar velocidade de transações',
        errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }

  /**
   * Executa todas as validações em sequência
   * Retorna o primeiro erro encontrado ou sucesso se todas passarem
   */
  async validateAll(
    sourceIdentityId: string,
    accountId: string,
    amount: number,
    userId: string,
    transactionId: string,
  ): Promise<ValidationResult> {
    // 1. Validar saldo suficiente (considerando transações pendentes)
    const balanceValidation = await this.validateBalance(
      accountId,
      amount,
      userId,
    );
    if (!balanceValidation.valid) {
      return balanceValidation;
    }

    // 2. Validar velocidade de transações (anti-fraude)
    const velocityValidation = await this.validateTransactionVelocity(
      userId,
      accountId,
    );
    if (!velocityValidation.valid) {
      return velocityValidation;
    }

    // 3. Validar limite máximo por transação
    const maxAmountValidation = await this.validateMaxAmountPerTransaction(
      sourceIdentityId,
      amount,
    );
    if (!maxAmountValidation.valid) {
      return maxAmountValidation;
    }

    // 4. Validar limite diário por valor
    const dailyLimitValidation = await this.validateDailyLimit(
      sourceIdentityId,
      userId,
      accountId,
      amount,
      transactionId,
    );
    if (!dailyLimitValidation.valid) {
      return dailyLimitValidation;
    }

    // 5. Validar limite diário por quantidade
    const countDailyValidation = await this.validateTransactionCountDaily(
      sourceIdentityId,
      userId,
      accountId,
      transactionId,
    );
    if (!countDailyValidation.valid) {
      return countDailyValidation;
    }

    return { valid: true };
  }
}
