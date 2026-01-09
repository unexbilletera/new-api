import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { LoggerService } from '../../shared/logger/logger.service';
import { CronosService } from '../../shared/cronos/cronos.service';
import type { transactions_status } from '../../../generated/prisma';

@Injectable()
export class PixCronosHandler {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private cronosService: CronosService,
  ) {}

  async handleCreate(payload: {
    transactionId: string;
    userId: string;
    sourceAccountId: string;
    sourceIdentityId: string;
    amount: number;
    targetKeyType: string;
    targetKeyValue: string;
    description?: string;
  }): Promise<void> {
    this.logger.info(
      `Processing PIX Cronos create for transaction: ${payload.transactionId}`,
    );

    try {
      const transaction = await this.prisma.transactions.findUnique({
        where: { id: payload.transactionId },
      });

      if (!transaction) {
        this.logger.error(`Transaction not found: ${payload.transactionId}`);
        return;
      }

      if (transaction.status !== 'pending') {
        this.logger.warn(
          `Transaction ${payload.transactionId} is not pending. Status: ${transaction.status}`,
        );
        return;
      }

      this.logger.info(
        `PIX Cronos create job processed successfully for transaction: ${payload.transactionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing PIX Cronos create job: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      try {
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
      } catch (updateError) {
        this.logger.error(
          `Error updating transaction status: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`,
        );
      }

      throw error;
    }
  }

  async handleConfirm(payload: {
    transactionId: string;
    userId: string;
  }): Promise<void> {
    this.logger.info(
      `Processing PIX Cronos confirm for transaction: ${payload.transactionId}`,
    );

    try {
      const transaction = await this.prisma.transactions.findFirst({
        where: {
          id: payload.transactionId,
          userId: payload.userId,
          type: 'cashout_cronos',
        },
        include: {
          users_transactions_userIdTousers: {
            include: {
              usersAccounts: {
                where: { status: 'enable' },
                take: 1,
              },
            },
          },
        },
      });

      if (!transaction) {
        this.logger.error(`Transaction not found: ${payload.transactionId}`);
        return;
      }

      if (transaction.status !== 'process') {
        this.logger.warn(
          `Transaction ${payload.transactionId} is not in process status. Status: ${transaction.status}`,
        );
        return;
      }

      if (!transaction.cronosId) {
        this.logger.error(
          '[PixCronosHandler] ERROR',
          `Transaction ${payload.transactionId} is missing cronosId. Create the PIX transfer first.`,
        );
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
        return;
      }

      if (!transaction.sourceTaxDocumentNumber) {
        this.logger.error(
          '[PixCronosHandler] ERROR',
          `Transaction ${payload.transactionId} is missing sourceTaxDocumentNumber.`,
        );
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
        return;
      }

      if (!transaction.amount) {
        this.logger.error(
          '[PixCronosHandler] ERROR',
          `Transaction ${payload.transactionId} is missing amount.`,
        );
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
        return;
      }

      this.logger.info(
        '[PixCronosHandler]',
        `Confirming PIX transfer in Cronos API - transactionId: ${payload.transactionId}, cronosId: ${transaction.cronosId}`,
      );

      try {
        this.logger.info(
          '[PixCronosHandler]',
          `Creating transactional token in Cronos - document: ${transaction.sourceTaxDocumentNumber}, amount: ${Number(transaction.amount)}`,
        );
        await this.cronosService.createTransactionalToken({
          document: transaction.sourceTaxDocumentNumber,
          amount: Number(transaction.amount),
          lat: 0,
          lon: 0,
        });

        this.logger.info(
          '[PixCronosHandler]',
          `Confirming transactional password in Cronos - document: ${transaction.sourceTaxDocumentNumber}`,
        );
        await this.cronosService.confirmTransactionPassword({
          document: transaction.sourceTaxDocumentNumber,
        });

        const confirmResult = (await this.cronosService.confirmTransferPix({
          document: transaction.sourceTaxDocumentNumber,
          id: transaction.cronosId,
          amount: Number(transaction.amount),
          description: transaction.reason || 'PIX transfer',
        })) as { success?: boolean };

        if (!confirmResult || confirmResult.success === false) {
          this.logger.error(
            '[PixCronosHandler] ERROR',
            `Cronos API returned an error while confirming transfer: ${JSON.stringify(confirmResult)}`,
          );
          await this.prisma.transactions.update({
            where: { id: payload.transactionId },
            data: {
              status: 'error' as transactions_status,
              updatedAt: new Date(),
            },
          });
          return;
        }

        if (!transaction.sourceAccountId) {
          this.logger.error(
            '[PixCronosHandler] ERROR',
            `Transaction ${payload.transactionId} is missing sourceAccountId. Cannot debit balance.`,
          );
          await this.prisma.transactions.update({
            where: { id: payload.transactionId },
            data: {
              status: 'error' as transactions_status,
              updatedAt: new Date(),
            },
          });
          return;
        }

        const sourceAccount = await this.prisma.usersAccounts.findUnique({
          where: { id: transaction.sourceAccountId },
        });

        if (!sourceAccount) {
          this.logger.error(
            '[PixCronosHandler] ERROR',
            `Source account not found for transactionId: ${payload.transactionId}, sourceAccountId: ${transaction.sourceAccountId}`,
          );
          await this.prisma.transactions.update({
            where: { id: payload.transactionId },
            data: {
              status: 'error' as transactions_status,
              updatedAt: new Date(),
            },
          });
          return;
        }

        const currentBalance = Number(sourceAccount.balance ?? 0);
        const transactionAmount = Number(transaction.amount);

        if (Number.isNaN(currentBalance) || Number.isNaN(transactionAmount)) {
          this.logger.error(
            '[PixCronosHandler] ERROR',
            `Invalid balance or transaction amount. balance=${sourceAccount.balance?.toString() ?? 'null'}, amount=${transaction.amount?.toString() ?? 'null'}`,
          );
          await this.prisma.transactions.update({
            where: { id: payload.transactionId },
            data: {
              status: 'error' as transactions_status,
              updatedAt: new Date(),
            },
          });
          return;
        }

        const newBalance = currentBalance - transactionAmount;

        await this.prisma.$transaction([
          this.prisma.usersAccounts.update({
            where: { id: sourceAccount.id },
            data: {
              balance: newBalance,
              updatedAt: new Date(),
            },
          }),
          this.prisma.transactions.update({
            where: { id: payload.transactionId },
            data: {
              status: 'confirm' as transactions_status,
              updatedAt: new Date(),
            },
          }),
        ]);

        this.logger.success(
          '[PixCronosHandler] SUCCESS',
          `PIX transfer confirmed successfully - transactionId: ${payload.transactionId}, cronosId: ${transaction.cronosId}`,
        );
      } catch (error) {
        this.logger.errorWithStack(
          '[PixCronosHandler] CRITICAL ERROR',
          `Error confirming PIX transfer in Cronos API - transactionId: ${payload.transactionId}`,
          error,
        );

        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });

        throw error;
      }
    } catch (error) {
      this.logger.error(
        `Error processing PIX Cronos confirm job: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      try {
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
      } catch (updateError) {
        this.logger.error(
          `Error updating transaction status: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`,
        );
      }

      throw error;
    }
  }
}
