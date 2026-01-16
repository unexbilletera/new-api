import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/prisma/prisma.service';
import {
  ErrorCodes,
  ErrorHelper,
} from '../../../../../shared/errors/app-error';
import { ColoredLogger } from '../../../../../shared/utils/logger-colors';
import { randomUUID } from 'crypto';
import type { transactions_status } from '../../../../../../generated/prisma';

@Injectable()
export class BoletoCronosTransactionModel {
  constructor(private prisma: PrismaService) {}

  async findSourceAccount(userId: string, accountId: string) {
    try {
      const sourceAccount = await this.prisma.usersAccounts.findFirst({
        where: {
          id: accountId,
          userId: userId,
          status: 'enable',
          deletedAt: null,
        },
        include: {
          usersIdentities: true,
        },
      });

      if (!sourceAccount) {
        ColoredLogger.error(
          '[BoletoCronosTransactionModel] ❌',
          `Conta não encontrada - userId: ${userId}, accountId: ${accountId}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_ACCOUNT,
        );
      }

      const sourceIdentity = sourceAccount.usersIdentities;
      if (!sourceIdentity) {
        ColoredLogger.error(
          '[BoletoCronosTransactionModel] ❌',
          `Identidade não encontrada para conta - accountId: ${sourceAccount.id}, userIdentityId: ${sourceAccount.userIdentityId}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_IDENTITY,
        );
      }

      if (sourceIdentity.status !== 'enable') {
        ColoredLogger.warning(
          '[BoletoCronosTransactionModel] ⚠️',
          `Identidade não está habilitada - identityId: ${sourceIdentity.id}, status: ${sourceIdentity.status}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_IDENTITY,
        );
      }

      return {
        account: sourceAccount,
        identity: sourceIdentity,
      };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[BoletoCronosTransactionModel] ❌ ERRO CRÍTICO',
        'Erro ao buscar conta de origem',
        error,
      );
      throw error;
    }
  }

  async createWithLock(data: {
    userId: string;
    amount: number;
    sourceAccountId: string;
    sourceIdentityId: string;
    sourceTaxDocumentNumber: string;
    barcode: string;
    description?: string;
    idempotencyKey?: string;
  }) {
    return await this.prisma.$transaction(async (tx) => {
      if (data.idempotencyKey) {
        const existingByIdempotency = await tx.transactions.findFirst({
          where: {
            userId: data.userId,
            sourceAccountId: data.sourceAccountId,
            type: 'payment_cronos',
            code: data.idempotencyKey,
          },
        });

        if (existingByIdempotency) {
          ColoredLogger.warning(
            '[BoletoCronosTransactionModel] ⚠️',
            `Transação com idempotencyKey já existe - transactionId: ${existingByIdempotency.id}, idempotencyKey: ${data.idempotencyKey}`,
          );
          throw ErrorHelper.badRequest(
            ErrorCodes.TRANSACTIONS_DUPLICATE_TRANSACTION,
            `Transação com esta chave de idempotência já existe. TransactionId: ${existingByIdempotency.id}`,
          );
        }
      }

      const lockedAccount = await tx.$queryRaw<
        Array<{
          id: string;
          userId: string;
          balance: unknown;
        }>
      >`
        SELECT id, userId, balance
        FROM usersAccounts
        WHERE id = ${data.sourceAccountId}
        FOR UPDATE
      `;

      if (!lockedAccount || lockedAccount.length === 0) {
        ColoredLogger.error(
          '[BoletoCronosTransactionModel] ❌',
          `Conta não encontrada para lock - accountId: ${data.sourceAccountId}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_ACCOUNT,
        );
      }

      const account = lockedAccount[0];

      if (account.userId !== data.userId) {
        ColoredLogger.error(
          '[BoletoCronosTransactionModel] ❌',
          `Conta não pertence ao usuário - accountUserId: ${account.userId}, requestUserId: ${data.userId}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_ACCOUNT,
        );
      }

      const pendingSum = await tx.transactions.aggregate({
        where: {
          userId: data.userId,
          sourceAccountId: data.sourceAccountId,
          status: 'pending',
        },
        _sum: {
          amount: true,
        },
      });

      const currentBalance = Number(account.balance ?? 0);
      const reservedAmount = Number(pendingSum._sum.amount ?? 0);
      const availableBalance = currentBalance - reservedAmount;
      const transactionAmount = Number(data.amount);

      if (Number.isNaN(availableBalance) || Number.isNaN(transactionAmount)) {
        ColoredLogger.error(
          '[BoletoCronosTransactionModel] ❌',
          `Valores inválidos - availableBalance: ${availableBalance}, transactionAmount: ${transactionAmount}`,
        );
        throw ErrorHelper.badRequest(ErrorCodes.TRANSACTIONS_INVALID_AMOUNT);
      }

      if (availableBalance < transactionAmount) {
        ColoredLogger.error(
          '[BoletoCronosTransactionModel] ❌',
          `Saldo insuficiente - availableBalance: ${availableBalance.toFixed(2)}, transactionAmount: ${transactionAmount.toFixed(2)}, reservedAmount: ${reservedAmount.toFixed(2)}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INSUFFICIENT_BALANCE,
          `Saldo insuficiente. Saldo disponível: ${availableBalance.toFixed(2)}, Valor necessário: ${transactionAmount.toFixed(2)}`,
        );
      }

      const reference = data.barcode;
      const thirtySecondsAgo = new Date(Date.now() - 30000);

      const recentDuplicate = await tx.transactions.findFirst({
        where: {
          userId: data.userId,
          sourceAccountId: data.sourceAccountId,
          type: 'payment_cronos',
          status: { in: ['pending', 'process', 'confirm'] },
          amount: transactionAmount,
          reference,
          createdAt: { gte: thirtySecondsAgo },
        },
      });

      if (recentDuplicate) {
        ColoredLogger.warning(
          '[BoletoCronosTransactionModel] ⚠️',
          `Transação duplicada detectada - transactionId: ${recentDuplicate.id}, reference: ${reference}, amount: ${transactionAmount}, status: ${recentDuplicate.status}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_DUPLICATE_TRANSACTION,
          'Transação duplicada detectada. Aguarde alguns segundos antes de tentar novamente.',
        );
      }

      const oneMinuteAgo = new Date(Date.now() - 60000);
      const recentCount = await tx.transactions.count({
        where: {
          userId: data.userId,
          sourceAccountId: data.sourceAccountId,
          type: 'payment_cronos',
          status: { in: ['pending', 'process', 'confirm'] },
          createdAt: { gte: oneMinuteAgo },
        },
      });

      const maxTransactionsPerMinute = 3;
      if (recentCount >= maxTransactionsPerMinute) {
        ColoredLogger.warning(
          '[BoletoCronosTransactionModel] ⚠️',
          `Limite de velocidade excedido - userId: ${data.userId}, accountId: ${data.sourceAccountId}, recentCount: ${recentCount}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_VELOCITY_LIMIT_EXCEEDED,
          `Muitas transações em pouco tempo. Aguarde alguns minutos antes de tentar novamente. (${recentCount} transações nos últimos 60 segundos)`,
        );
      }

      const now = new Date();
      const transaction = await tx.transactions.create({
        data: {
          id: randomUUID(),
          date: now,
          userId: data.userId,
          type: 'payment_cronos',
          status: 'pending',
          amount: transactionAmount,
          currency: 'BRL',
          sourceAccountId: data.sourceAccountId,
          sourceIdentityId: data.sourceIdentityId,
          sourceTaxDocumentNumber: data.sourceTaxDocumentNumber,
          reference: reference,
          reason: data.description || 'Pagamento de boleto',
          code: data.idempotencyKey || null,
          createdAt: now,
          updatedAt: now,
        },
      });

      ColoredLogger.success(
        '[BoletoCronosTransactionModel] ✅',
        `Transação criada com segurança - transactionId: ${transaction.id}, amount: ${transactionAmount.toFixed(2)}, availableBalance antes: ${availableBalance.toFixed(2)}`,
      );

      return transaction;
    });
  }

  async findPendingById(transactionId: string, userId: string) {
    return await this.prisma.transactions.findFirst({
      where: {
        id: transactionId,
        userId,
        type: 'payment_cronos',
        status: 'pending',
      },
    });
  }

  async updateStatus(transactionId: string, status: transactions_status) {
    return await this.prisma.transactions.update({
      where: { id: transactionId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }
}
