import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { CronosWebhookDto } from '../dto/cronos-webhook.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CronosWebhookService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async processPixCashin(dto: CronosWebhookDto): Promise<{
    success: boolean;
    message: string;
    transactionId?: string;
  }> {
    try {
      this.logger.info('[CronosWebhookService]', 'Processing PIX cashin', {
        id: dto.id,
        amount: dto.amount,
        customer_document: dto.customer_document,
      });

      if (!dto.customer_document) {
        this.logger.warn(
          '[CronosWebhookService] WARNING',
          'Missing customer_document in webhook',
        );
        return {
          success: false,
          message: 'Missing customer_document',
        };
      }

      const identity = await this.prisma.usersIdentities.findFirst({
        where: {
          taxDocumentNumber: dto.customer_document,
          status: 'enable',
          deletedAt: null,
        },
      });

      if (!identity) {
        this.logger.warn(
          '[CronosWebhookService] WARNING',
          `Identity not found for document: ${dto.customer_document}`,
        );
        return {
          success: false,
          message: 'Identity not found',
        };
      }

      const account = await this.prisma.usersAccounts.findFirst({
        where: {
          userIdentityId: identity.id,
          type: 'cronos',
          status: 'enable',
          deletedAt: null,
        },
      });

      if (!account) {
        this.logger.warn(
          '[CronosWebhookService] WARNING',
          `Cronos account not found for identity: ${identity.id}`,
        );
        return {
          success: false,
          message: 'Cronos account not found',
        };
      }

      const existingTransaction = await this.prisma.transactions.findFirst({
        where: {
          cronosId: dto.id,
          type: 'cashin_cronos',
        },
      });

      if (existingTransaction) {
        this.logger.info(
          '[CronosWebhookService]',
          `Transaction already processed: ${existingTransaction.id}`,
        );
        return {
          success: true,
          message: 'Transaction already processed',
          transactionId: existingTransaction.id,
        };
      }

      const now = new Date();
      const transaction = await this.prisma.transactions.create({
        data: {
          id: randomUUID(),
          date: now,
          userId: identity.userId,
          type: 'cashin_cronos',
          status: 'confirm',
          amount: dto.amount,
          currency: 'BRL',
          targetAccountId: account.id,
          targetIdentityId: identity.id,
          targetTaxDocumentNumber: dto.customer_document,
          sourceName: dto.payer_name || null,
          sourceTaxDocumentNumber: dto.payer_document || null,
          reference: dto.EndToEnd || null,
          reason: dto.description || 'PIX Received',
          cronosId: dto.id,
          createdAt: now,
          updatedAt: now,
        },
      });

      const currentBalance = Number(account.balance) || 0;
      const newBalance = currentBalance + dto.amount;

      await this.prisma.usersAccounts.update({
        where: { id: account.id },
        data: {
          balance: newBalance,
          updatedAt: now,
        },
      });

      this.logger.success(
        '[CronosWebhookService] SUCCESS',
        `PIX cashin processed - transaction: ${transaction.id}, amount: ${dto.amount}, newBalance: ${newBalance}`,
      );

      return {
        success: true,
        message: 'Transaction processed successfully',
        transactionId: transaction.id,
      };
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosWebhookService] CRITICAL',
        'Failed to process PIX cashin',
        error,
      );
      throw error;
    }
  }

  async processPixCashout(dto: CronosWebhookDto): Promise<{
    success: boolean;
    message: string;
    transactionId?: string;
  }> {
    try {
      this.logger.info('[CronosWebhookService]', 'Processing PIX cashout callback', {
        id: dto.id,
        status: dto.status,
      });

      const transaction = await this.prisma.transactions.findFirst({
        where: {
          cronosId: dto.id,
          type: 'cashout_cronos',
        },
      });

      if (!transaction) {
        this.logger.warn(
          '[CronosWebhookService] WARNING',
          `Transaction not found for cronosId: ${dto.id}`,
        );
        return {
          success: false,
          message: 'Transaction not found',
        };
      }

      const newStatus = dto.status === 'completed' || dto.status === 'success'
        ? 'confirm'
        : dto.status === 'failed' || dto.status === 'error'
          ? 'error'
          : 'process';

      await this.prisma.transactions.update({
        where: { id: transaction.id },
        data: {
          status: newStatus as 'pending' | 'process' | 'confirm' | 'reverse' | 'cancel' | 'error',
          updatedAt: new Date(),
        },
      });

      this.logger.success(
        '[CronosWebhookService] SUCCESS',
        `PIX cashout updated - transaction: ${transaction.id}, status: ${newStatus}`,
      );

      return {
        success: true,
        message: 'Transaction updated successfully',
        transactionId: transaction.id,
      };
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosWebhookService] CRITICAL',
        'Failed to process PIX cashout callback',
        error,
      );
      throw error;
    }
  }

  async processBilletPayment(dto: CronosWebhookDto): Promise<{
    success: boolean;
    message: string;
    transactionId?: string;
  }> {
    try {
      this.logger.info('[CronosWebhookService]', 'Processing billet payment callback', {
        id: dto.id,
        status: dto.status,
      });

      const transaction = await this.prisma.transactions.findFirst({
        where: {
          cronosId: dto.id,
          type: 'cashout_cronos',
        },
      });

      if (!transaction) {
        this.logger.warn(
          '[CronosWebhookService] WARNING',
          `Billet transaction not found for cronosId: ${dto.id}`,
        );
        return {
          success: false,
          message: 'Transaction not found',
        };
      }

      const newStatus = dto.status === 'completed' || dto.status === 'success' || dto.status === 'paid'
        ? 'confirm'
        : dto.status === 'failed' || dto.status === 'error'
          ? 'error'
          : 'process';

      await this.prisma.transactions.update({
        where: { id: transaction.id },
        data: {
          status: newStatus as 'pending' | 'process' | 'confirm' | 'reverse' | 'cancel' | 'error',
          updatedAt: new Date(),
        },
      });

      this.logger.success(
        '[CronosWebhookService] SUCCESS',
        `Billet payment updated - transaction: ${transaction.id}, status: ${newStatus}`,
      );

      return {
        success: true,
        message: 'Transaction updated successfully',
        transactionId: transaction.id,
      };
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosWebhookService] CRITICAL',
        'Failed to process billet payment callback',
        error,
      );
      throw error;
    }
  }
}
