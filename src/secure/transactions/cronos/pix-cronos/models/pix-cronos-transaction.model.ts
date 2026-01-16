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
export class PixCronosTransactionModel {
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
          '[PixCronosTransactionModel] ❌',
          `Conta não encontrada - userId: ${userId}, accountId: ${accountId}`,
        );
        // Tentar buscar sem filtrar por userId para debug
        const accountWithoutUserFilter =
          await this.prisma.usersAccounts.findFirst({
            where: {
              id: accountId,
              status: 'enable',
              deletedAt: null,
            },
            include: {
              usersIdentities: true,
            },
          });

        if (accountWithoutUserFilter) {
          ColoredLogger.warning(
            '[PixCronosTransactionModel] ⚠️',
            `Conta encontrada mas userId não corresponde - accountUserId: ${accountWithoutUserFilter.userId}, requestUserId: ${userId}`,
          );
        } else {
          ColoredLogger.error(
            '[PixCronosTransactionModel] ❌',
            `Conta não encontrada mesmo sem filtro de userId`,
          );
        }

        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_ACCOUNT,
        );
      }

      ColoredLogger.debug(
        '[PixCronosTransactionModel]',
        `Conta encontrada - accountId: ${sourceAccount.id}, userIdentityId: ${sourceAccount.userIdentityId}`,
      );

      const sourceIdentity = sourceAccount.usersIdentities;
      if (!sourceIdentity) {
        ColoredLogger.error(
          '[PixCronosTransactionModel] ❌',
          `Identidade não encontrada para conta - accountId: ${sourceAccount.id}, userIdentityId: ${sourceAccount.userIdentityId}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_IDENTITY,
        );
      }

      if (sourceIdentity.status !== 'enable') {
        ColoredLogger.warning(
          '[PixCronosTransactionModel] ⚠️',
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
        '[PixCronosTransactionModel] ❌ ERRO CRÍTICO',
        'Erro ao buscar conta de origem',
        error,
      );
      throw error;
    }
  }

  async create(data: {
    userId: string;
    amount: number;
    sourceAccountId: string;
    sourceIdentityId: string;
    sourceTaxDocumentNumber: string;
    targetKeyType: string;
    targetKeyValue: string;
    description?: string;
    targetName?: string;
    targetAlias?: string;
    targetTaxDocumentNumber?: string;
    targetTaxDocumentType?: string;
    targetBank?: string;
    targetAccountNumber?: string;
    cronosId?: string;
  }) {
    const now = new Date();
    const transaction = await this.prisma.transactions.create({
      data: {
        id: randomUUID(),
        date: now,
        userId: data.userId,
        type: 'cashout_cronos',
        status: 'pending',
        amount: data.amount,
        currency: 'BRL',
        sourceAccountId: data.sourceAccountId,
        sourceIdentityId: data.sourceIdentityId,
        sourceTaxDocumentNumber: data.sourceTaxDocumentNumber,
        reference: `${data.targetKeyType}:${data.targetKeyValue}`,
        reason: data.description || 'Transferência PIX',
        targetName: data.targetName || null,
        targetAlias: data.targetAlias || null,
        targetTaxDocumentNumber: data.targetTaxDocumentNumber || null,
        targetTaxDocumentType: data.targetTaxDocumentType || null,
        targetBank: data.targetBank || null,
        targetAccountNumber: data.targetAccountNumber || null,
        cronosId: data.cronosId || null,
        createdAt: now,
        updatedAt: now,
      },
    });

    return transaction;
  }

  /**
   * Cria transação com proteções de segurança:
   * - Lock transacional (SELECT FOR UPDATE)
   * - Validação de saldo disponível (balance - pending)
   * - Validação de duplicidade
   * - Cancelamento automático de pending antigas
   * Tudo dentro de uma transação atômica
   */
  async createWithLock(data: {
    userId: string;
    amount: number;
    sourceAccountId: string;
    sourceIdentityId: string;
    sourceTaxDocumentNumber: string;
    targetKeyType: string;
    targetKeyValue: string;
    description?: string;
    idempotencyKey?: string;
    targetName?: string;
    targetAlias?: string;
    targetTaxDocumentNumber?: string;
    targetTaxDocumentType?: string;
    targetBank?: string;
    targetAccountNumber?: string;
    cronosId?: string;
  }) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. LOCK da conta (SELECT FOR UPDATE) - previne race conditions
      const lockedAccount = await tx.$queryRaw<
        Array<{
          id: string;
          userId: string;
          balance: unknown; // Decimal do Prisma retorna como string ou number
        }>
      >`
        SELECT id, userId, balance 
        FROM usersAccounts 
        WHERE id = ${data.sourceAccountId} 
        FOR UPDATE
      `;

      if (!lockedAccount || lockedAccount.length === 0) {
        ColoredLogger.error(
          '[PixCronosTransactionModel] ❌',
          `Conta não encontrada para lock - accountId: ${data.sourceAccountId}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_ACCOUNT,
        );
      }

      const account = lockedAccount[0];

      // Verificar se a conta pertence ao usuário
      if (account.userId !== data.userId) {
        ColoredLogger.error(
          '[PixCronosTransactionModel] ❌',
          `Conta não pertence ao usuário - accountUserId: ${account.userId}, requestUserId: ${data.userId}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_ACCOUNT,
        );
      }

      // 2. Verificar idempotencyKey (se fornecido) - primeiro de tudo
      // Se já existir, não cancelar pendências antigas
      if (data.idempotencyKey) {
        const existingByIdempotency = await tx.transactions.findFirst({
          where: {
            userId: data.userId,
            sourceAccountId: data.sourceAccountId,
            type: 'cashout_cronos',
            code: data.idempotencyKey, // Usar campo 'code' para armazenar idempotencyKey
          },
        });

        if (existingByIdempotency) {
          ColoredLogger.warning(
            '[PixCronosTransactionModel] ⚠️',
            `Transação com idempotencyKey já existe - transactionId: ${existingByIdempotency.id}, idempotencyKey: ${data.idempotencyKey}`,
          );
          throw ErrorHelper.badRequest(
            ErrorCodes.TRANSACTIONS_DUPLICATE_TRANSACTION,
            `Transação com esta chave de idempotência já existe. TransactionId: ${existingByIdempotency.id}`,
          );
        }
      }

      // 3. Cancelar transações pending antigas de cashout_cronos (antes de calcular saldo)
      // Isso libera o saldo reservado por transações PIX Cronos abandonadas
      // Nota: Cancelamos apenas cashout_cronos para não afetar outros tipos de transação
      const cancelledCount = await tx.transactions.updateMany({
        where: {
          userId: data.userId,
          sourceAccountId: data.sourceAccountId,
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
          '[PixCronosTransactionModel]',
          `Canceladas ${cancelledCount.count} transações cashout_cronos pending antigas para userId: ${data.userId}, accountId: ${data.sourceAccountId}`,
        );
      }

      // 4. Calcular saldo disponível (balance - soma de TODAS as transações pending que debitam)
      // Considera TODOS os tipos de transação pending, não apenas cashout_cronos
      // Isso garante que o saldo reservado por outras transações também seja considerado
      const pendingSum = await tx.transactions.aggregate({
        where: {
          userId: data.userId,
          sourceAccountId: data.sourceAccountId,
          status: 'pending',
          // Não filtrar por tipo - considerar TODAS as transações pending que debitam da conta
        },
        _sum: {
          amount: true,
        },
      });

      const currentBalance = Number(account.balance ?? 0);
      const reservedAmount = Number(pendingSum._sum.amount ?? 0);
      const availableBalance = currentBalance - reservedAmount;
      const transactionAmount = Number(data.amount);

      // 5. Validar saldo disponível
      if (Number.isNaN(availableBalance) || Number.isNaN(transactionAmount)) {
        ColoredLogger.error(
          '[PixCronosTransactionModel] ❌',
          `Valores inválidos - availableBalance: ${availableBalance}, transactionAmount: ${transactionAmount}`,
        );
        throw ErrorHelper.badRequest(ErrorCodes.TRANSACTIONS_INVALID_AMOUNT);
      }

      if (availableBalance < transactionAmount) {
        ColoredLogger.error(
          '[PixCronosTransactionModel] ❌',
          `Saldo insuficiente - availableBalance: ${availableBalance.toFixed(2)}, transactionAmount: ${transactionAmount.toFixed(2)}, reservedAmount: ${reservedAmount.toFixed(2)}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INSUFFICIENT_BALANCE,
          `Saldo insuficiente. Saldo disponível: ${availableBalance.toFixed(2)}, Valor necessário: ${transactionAmount.toFixed(2)}`,
        );
      }

      // 6. Verificar duplicidade (mesma chave PIX + amount recente)
      // Janela aumentada para 30 segundos e incluindo status 'confirm'
      const reference = `${data.targetKeyType}:${data.targetKeyValue}`;
      const thirtySecondsAgo = new Date(Date.now() - 30000);

      const recentDuplicate = await tx.transactions.findFirst({
        where: {
          userId: data.userId,
          sourceAccountId: data.sourceAccountId,
          type: 'cashout_cronos',
          status: { in: ['pending', 'process', 'confirm'] }, // Incluindo 'confirm'
          amount: transactionAmount,
          reference: reference,
          createdAt: { gte: thirtySecondsAgo },
        },
      });

      if (recentDuplicate) {
        ColoredLogger.warning(
          '[PixCronosTransactionModel] ⚠️',
          `Transação duplicada detectada - transactionId: ${recentDuplicate.id}, reference: ${reference}, amount: ${transactionAmount}, status: ${recentDuplicate.status}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_DUPLICATE_TRANSACTION,
          'Transação duplicada detectada. Aguarde alguns segundos antes de tentar novamente.',
        );
      }

      // 7. Validar velocidade de transações (anti-fraude)
      // Nota: Usamos uma query dentro da transação para garantir consistência
      const oneMinuteAgo = new Date(Date.now() - 60000);
      const recentCount = await tx.transactions.count({
        where: {
          userId: data.userId,
          sourceAccountId: data.sourceAccountId,
          type: 'cashout_cronos',
          status: { in: ['pending', 'process', 'confirm'] },
          createdAt: { gte: oneMinuteAgo },
        },
      });

      const maxTransactionsPerMinute = 3;
      if (recentCount >= maxTransactionsPerMinute) {
        ColoredLogger.warning(
          '[PixCronosTransactionModel] ⚠️',
          `Limite de velocidade excedido - userId: ${data.userId}, accountId: ${data.sourceAccountId}, recentCount: ${recentCount}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_VELOCITY_LIMIT_EXCEEDED,
          `Muitas transações em pouco tempo. Aguarde alguns minutos antes de tentar novamente. (${recentCount} transações nos últimos 60 segundos)`,
        );
      }

      // 8. Validar limite de quantidade diária (se configurado no perfil)
      // Buscar limites da identidade para verificar maxCountDaily
      const identityLimits = await tx.user_identity_spending_limits.findFirst({
        where: {
          userIdentityId: data.sourceIdentityId,
          deletedAt: null,
        },
        include: {
          usersIdentities: {
            select: { country: true },
          },
        },
      });

      if (identityLimits) {
        let maxCountDaily: number | undefined;

        type LimitsConfig = {
          pix?: { maxCountDaily?: number };
          qrCode?: { maxCountDaily?: number };
          transfer?: { maxCountDaily?: number };
        };

        const parseLimits = (value: unknown): LimitsConfig | null => {
          if (!value) return null;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value) as LimitsConfig;
            } catch {
              ColoredLogger.warning(
                '[PixCronosTransactionModel]',
                'Falha ao fazer parse de limits (string inválida)',
              );
              return null;
            }
          }
          return value as LimitsConfig;
        };

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

        const pickMaxCountDaily = (
          limits: LimitsConfig | null,
        ): number | undefined => {
          if (!limits) return undefined;

          // Para PIX Cronos, aplicar o limite mais restritivo disponível
          return pickMinDefined([
            limits.qrCode?.maxCountDaily,
            limits.transfer?.maxCountDaily,
            limits.pix?.maxCountDaily,
          ]);
        };

        if (identityLimits.isCustom) {
          const limitsAr = parseLimits(identityLimits.limitsAr);
          const limitsBr = parseLimits(identityLimits.limitsBr);

          if (identityLimits.usersIdentities?.country === 'ar') {
            maxCountDaily = pickMaxCountDaily(limitsAr);
          } else if (identityLimits.usersIdentities?.country === 'br') {
            maxCountDaily = pickMaxCountDaily(limitsBr);
          }
        } else if (identityLimits.profileId) {
          const profile = await tx.spending_limit_profiles.findUnique({
            where: { id: identityLimits.profileId },
          });

          if (profile) {
            const limitsAr = parseLimits(profile.limitsAr);
            const limitsBr = parseLimits(profile.limitsBr);

            if (identityLimits.usersIdentities?.country === 'ar') {
              maxCountDaily = pickMaxCountDaily(limitsAr);
            } else if (identityLimits.usersIdentities?.country === 'br') {
              maxCountDaily = pickMaxCountDaily(limitsBr);
            }
          }
        }

        // Se tiver limite configurado, validar
        if (maxCountDaily !== undefined && maxCountDaily > 0) {
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

          const dailyCount = await tx.transactions.count({
            where: {
              userId: data.userId,
              sourceAccountId: data.sourceAccountId,
              type: 'cashout_cronos',
              status: { in: ['pending', 'process', 'confirm'] },
              date: { gte: startOfDay, lte: endOfDay },
            },
          });

          if (dailyCount >= maxCountDaily) {
            ColoredLogger.warning(
              '[PixCronosTransactionModel] ⚠️',
              `Limite de quantidade diária excedido - userId: ${data.userId}, accountId: ${data.sourceAccountId}, dailyCount: ${dailyCount}, maxCountDaily: ${maxCountDaily}`,
            );
            throw ErrorHelper.badRequest(
              ErrorCodes.TRANSACTIONS_MAX_COUNT_PER_DAY_EXCEEDED,
              `Limite de transações diárias excedido. Limite: ${maxCountDaily}, Já utilizadas: ${dailyCount}`,
            );
          }
        }
      }

      // 9. Criar nova transação (dentro da mesma transação)
      const now = new Date();
      const transaction = await tx.transactions.create({
        data: {
          id: randomUUID(),
          date: now,
          userId: data.userId,
          type: 'cashout_cronos',
          status: 'pending',
          amount: transactionAmount,
          currency: 'BRL',
          sourceAccountId: data.sourceAccountId,
          sourceIdentityId: data.sourceIdentityId,
          sourceTaxDocumentNumber: data.sourceTaxDocumentNumber,
          reference: reference,
          reason: data.description || 'Transferência PIX',
          code: data.idempotencyKey || null, // Armazenar idempotencyKey no campo 'code'
          targetName: data.targetName || null,
          targetAlias: data.targetAlias || null,
          targetTaxDocumentNumber: data.targetTaxDocumentNumber || null,
          targetTaxDocumentType: data.targetTaxDocumentType || null,
          targetBank: data.targetBank || null,
          targetAccountNumber: data.targetAccountNumber || null,
          cronosId: data.cronosId || null,
          createdAt: now,
          updatedAt: now,
        },
      });

      ColoredLogger.success(
        '[PixCronosTransactionModel] ✅',
        `Transação criada com segurança - transactionId: ${transaction.id}, amount: ${transactionAmount.toFixed(2)}, availableBalance antes: ${availableBalance.toFixed(2)}`,
      );

      return transaction;
    });
  }

  async findById(transactionId: string, userId: string) {
    const transaction = await this.prisma.transactions.findFirst({
      where: {
        id: transactionId,
        userId: userId,
        type: 'cashout_cronos',
        deletedAt: null,
      },
    });

    if (!transaction) {
      throw ErrorHelper.notFound(ErrorCodes.TRANSACTIONS_INVALID_ID);
    }

    return transaction;
  }

  async findPendingById(transactionId: string, userId: string) {
    const transaction = await this.prisma.transactions.findFirst({
      where: {
        id: transactionId,
        userId: userId,
        type: 'cashout_cronos',
        status: 'pending',
        deletedAt: null,
      },
    });

    if (!transaction) {
      throw ErrorHelper.notFound(ErrorCodes.TRANSACTIONS_INVALID_ID);
    }

    return transaction;
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

  async updateCronosId(transactionId: string, cronosId: string) {
    return await this.prisma.transactions.update({
      where: { id: transactionId },
      data: {
        cronosId,
        updatedAt: new Date(),
      },
    });
  }

  async updateTargetInfo(
    transactionId: string,
    data: {
      targetName?: string;
      targetAlias?: string;
      targetTaxDocumentNumber?: string;
      targetTaxDocumentType?: string;
      targetBank?: string;
      targetAccountNumber?: string;
      cronosId?: string;
    },
  ) {
    return await this.prisma.transactions.update({
      where: { id: transactionId },
      data: {
        targetName: data.targetName || null,
        targetAlias: data.targetAlias || null,
        targetTaxDocumentNumber: data.targetTaxDocumentNumber || null,
        targetTaxDocumentType: data.targetTaxDocumentType || null,
        targetBank: data.targetBank || null,
        targetAccountNumber: data.targetAccountNumber || null,
        cronosId: data.cronosId || null,
        updatedAt: new Date(),
      },
    });
  }
}
