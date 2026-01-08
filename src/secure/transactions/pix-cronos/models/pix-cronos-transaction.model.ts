import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { ErrorCodes, ErrorHelper } from '../../../../shared/errors/app-error';
import { v4 as uuidv4 } from 'uuid';
import type { transactions_status } from '../../../../../generated/prisma';

/**
 * Model para operações de banco de dados relacionadas a transações PIX Cronos
 * Responsável apenas por operações no banco (CRUD)
 */
@Injectable()
export class PixCronosTransactionModel {
  constructor(private prisma: PrismaService) {}

  /**
   * Valida e busca conta de origem
   */
  async findSourceAccount(userId: string, accountId: string) {
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
      throw ErrorHelper.badRequest(
        ErrorCodes.TRANSACTIONS_INVALID_SOURCE_ACCOUNT,
      );
    }

    const sourceIdentity = sourceAccount.usersIdentities;
    if (!sourceIdentity || sourceIdentity.status !== 'enable') {
      throw ErrorHelper.badRequest(
        ErrorCodes.TRANSACTIONS_INVALID_SOURCE_IDENTITY,
      );
    }

    return {
      account: sourceAccount,
      identity: sourceIdentity,
    };
  }

  /**
   * Cria uma transação no banco de dados
   */
  async create(data: {
    userId: string;
    amount: number;
    sourceAccountId: string;
    sourceIdentityId: string;
    sourceTaxDocumentNumber: string;
    targetKeyType: string;
    targetKeyValue: string;
    description?: string;
  }) {
    const now = new Date();
    const transaction = await this.prisma.transactions.create({
      data: {
        id: uuidv4(),
        date: now,
        userId: data.userId,
        type: 'cashout_cronos',
        status: 'pending',
        amount: data.amount,
        currency: 'BRL',
        sourceAccountId: data.sourceAccountId,
        sourceIdentityId: data.sourceIdentityId,
        sourceTaxDocumentNumber: data.sourceTaxDocumentNumber,
        reference: `${data.targetKeyType}:${data.targetKeyValue}`, // Armazena chave PIX no reference
        reason: data.description || 'Transferência PIX',
        createdAt: now,
        updatedAt: now,
      },
    });

    return transaction;
  }

  /**
   * Busca uma transação por ID e userId
   */
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

  /**
   * Busca uma transação pendente por ID e userId
   */
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

  /**
   * Atualiza status de uma transação
   */
  async updateStatus(transactionId: string, status: transactions_status) {
    return await this.prisma.transactions.update({
      where: { id: transactionId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Atualiza cronosId de uma transação
   */
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
