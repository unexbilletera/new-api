import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { ErrorCodes, ErrorHelper } from '../../../../shared/errors/app-error';
import { LoggerService } from '../../../../shared/logger/logger.service';
import { randomUUID } from 'crypto';
import type { transactions_status } from '../../../../../generated/prisma';

@Injectable()
export class PixCronosTransactionModel {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

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
        this.logger.error(
          '[PixCronosTransactionModel] ERROR',
          `Account not found - userId: ${userId}, accountId: ${accountId}`,
        );
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
          this.logger.warn(
            '[PixCronosTransactionModel] WARNING',
            `Account found but userId mismatch - accountUserId: ${accountWithoutUserFilter.userId}, requestUserId: ${userId}`,
          );
        } else {
          this.logger.error(
            '[PixCronosTransactionModel] ERROR',
            `Account not found even without userId filter`,
          );
        }

        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_ACCOUNT,
        );
      }

      this.logger.debug(
        '[PixCronosTransactionModel]',
        `Account found - accountId: ${sourceAccount.id}, userIdentityId: ${sourceAccount.userIdentityId}`,
      );

      const sourceIdentity = sourceAccount.usersIdentities;
      if (!sourceIdentity) {
        this.logger.error(
          '[PixCronosTransactionModel] ERROR',
          `Identity not found for account - accountId: ${sourceAccount.id}, userIdentityId: ${sourceAccount.userIdentityId}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_IDENTITY,
        );
      }

      if (sourceIdentity.status !== 'enable') {
        this.logger.warn(
          '[PixCronosTransactionModel] WARNING',
          `Identity is not enabled - identityId: ${sourceIdentity.id}, status: ${sourceIdentity.status}`,
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
      this.logger.errorWithStack(
        '[PixCronosTransactionModel] CRITICAL',
        'Failed to fetch source account',
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
}
