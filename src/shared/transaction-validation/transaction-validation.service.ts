import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';
import { ErrorCodes } from '../errors/error-codes';
import type { transactions_status } from '../../../generated/prisma';

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

@Injectable()
export class TransactionValidationService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

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
          error: 'Source account not found',
          errorCode: ErrorCodes.TRANSACTIONS_INVALID_SOURCE_ACCOUNT,
        };
      }

      const currentBalance = Number(account.balance ?? 0);
      const transactionAmount = Number(amount);

      if (Number.isNaN(currentBalance) || Number.isNaN(transactionAmount)) {
        return {
          valid: false,
          error: 'Invalid balance or transaction amount',
          errorCode: ErrorCodes.TRANSACTIONS_INVALID_AMOUNT,
        };
      }

      let availableBalance = currentBalance;
      if (userId) {
        await this.prisma.transactions.updateMany({
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

        const pendingTransactions = await this.prisma.transactions.findMany({
          where: {
            sourceAccountId: accountId,
            status: { in: ['pending', 'process'] },
            deletedAt: null,
          },
          select: { amount: true },
        });

        const pendingAmount = pendingTransactions.reduce(
          (sum, tx) => sum + Number(tx.amount ?? 0),
          0,
        );

        availableBalance = currentBalance - pendingAmount;
      }

      if (availableBalance < transactionAmount) {
        this.logger.warn(
          '[TransactionValidationService]',
          `Insufficient balance - available: ${availableBalance}, required: ${transactionAmount}`,
        );
        return {
          valid: false,
          error: `Insufficient balance. Available: ${availableBalance.toFixed(2)}, Required: ${transactionAmount.toFixed(2)}`,
          errorCode: ErrorCodes.TRANSACTIONS_INSUFFICIENT_BALANCE,
        };
      }

      return { valid: true };
    } catch (error) {
      this.logger.errorWithStack(
        '[TransactionValidationService]',
        'Error validating balance',
        error,
      );
      return {
        valid: false,
        error: 'Error validating balance',
        errorCode: ErrorCodes.TRANSACTIONS_INVALID_SOURCE_ACCOUNT,
      };
    }
  }

  async validateMaxAmountPerTransaction(
    identityId: string,
    amount: number,
    transactionType: 'pix' | 'transfer' = 'pix',
  ): Promise<ValidationResult> {
    try {
      const limits = await this.getSpendingLimits(identityId, transactionType);

      if (!limits.maxPerTransaction) {
        return { valid: true };
      }

      if (amount > limits.maxPerTransaction) {
        this.logger.warn(
          '[TransactionValidationService]',
          `Max amount per transaction exceeded - amount: ${amount}, limit: ${limits.maxPerTransaction}`,
        );
        return {
          valid: false,
          error: `Maximum amount per transaction exceeded. Limit: ${limits.maxPerTransaction.toFixed(2)}`,
          errorCode: ErrorCodes.TRANSACTIONS_MAX_AMOUNT_PER_TRANSACTION_EXCEEDED,
        };
      }

      return { valid: true };
    } catch (error) {
      this.logger.errorWithStack(
        '[TransactionValidationService]',
        'Error validating max amount per transaction',
        error,
      );
      return { valid: true };
    }
  }

  async validateDailyLimit(
    identityId: string,
    userId: string,
    accountId: string,
    amount: number,
    transactionType: 'pix' | 'transfer' = 'pix',
  ): Promise<ValidationResult> {
    try {
      const limits = await this.getSpendingLimits(identityId, transactionType);

      if (!limits.maxDaily) {
        return { valid: true };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTransactions = await this.prisma.transactions.findMany({
        where: {
          userId,
          sourceAccountId: accountId,
          status: { in: ['pending', 'process', 'confirm'] },
          createdAt: { gte: today },
          deletedAt: null,
        },
        select: { amount: true },
      });

      const todayTotal = todayTransactions.reduce(
        (sum, tx) => sum + Number(tx.amount ?? 0),
        0,
      );

      if (todayTotal + amount > limits.maxDaily) {
        this.logger.warn(
          '[TransactionValidationService]',
          `Daily limit exceeded - today: ${todayTotal}, new: ${amount}, limit: ${limits.maxDaily}`,
        );
        return {
          valid: false,
          error: `Daily limit exceeded. Used today: ${todayTotal.toFixed(2)}, Limit: ${limits.maxDaily.toFixed(2)}`,
          errorCode: ErrorCodes.TRANSACTIONS_MAX_AMOUNT_PER_DAY_EXCEEDED,
        };
      }

      return { valid: true };
    } catch (error) {
      this.logger.errorWithStack(
        '[TransactionValidationService]',
        'Error validating daily limit',
        error,
      );
      return { valid: true };
    }
  }

  async validateAll(
    identityId: string,
    accountId: string,
    amount: number,
    userId: string,
    transactionType: 'pix' | 'transfer' = 'pix',
  ): Promise<ValidationResult> {
    const balanceResult = await this.validateBalance(accountId, amount, userId);
    if (!balanceResult.valid) return balanceResult;

    const maxAmountResult = await this.validateMaxAmountPerTransaction(
      identityId,
      amount,
      transactionType,
    );
    if (!maxAmountResult.valid) return maxAmountResult;

    const dailyResult = await this.validateDailyLimit(
      identityId,
      userId,
      accountId,
      amount,
      transactionType,
    );
    if (!dailyResult.valid) return dailyResult;

    return { valid: true };
  }

  private async getSpendingLimits(
    identityId: string,
    transactionType: 'pix' | 'transfer',
  ): Promise<SpendingLimits> {
    try {
      const identityLimit =
        await this.prisma.user_identity_spending_limits.findFirst({
          where: {
            userIdentityId: identityId,
            deletedAt: null,
          },
        });

      if (!identityLimit) {
        return {};
      }

      const limitsJson =
        transactionType === 'pix'
          ? (identityLimit.limitsBr as LimitsConfig | null)
          : (identityLimit.limitsBr as LimitsConfig | null);

      if (limitsJson) {
        const typeLimits = limitsJson[transactionType];
        if (typeLimits) {
          return {
            maxDaily: typeLimits.maxDaily,
            maxPerTransaction: typeLimits.maxPerTransaction,
            maxCountDaily: typeLimits.maxCountDaily,
          };
        }
      }

      const dailyLimit =
        transactionType === 'pix'
          ? identityLimit.dailyTransferLimit
          : identityLimit.dailyTransferLimit;

      return {
        maxDaily: dailyLimit ? Number(dailyLimit) : undefined,
      };
    } catch (error) {
      this.logger.errorWithStack(
        '[TransactionValidationService]',
        'Error getting spending limits',
        error,
      );
      return {};
    }
  }
}
