import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { LoggerService } from '../../shared/logger/logger.service';
import type { transactions_status } from '../../../generated/prisma';

@Injectable()
export class PixCronosHandler {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
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
    this.logger.info(`Processing PIX Cronos create for transaction: ${payload.transactionId}`);

    try {
      const transaction = await this.prisma.transactions.findUnique({
        where: { id: payload.transactionId },
      });

      if (!transaction) {
        this.logger.error(`Transaction not found: ${payload.transactionId}`);
        return;
      }

      if (transaction.status !== 'pending') {
        this.logger.warn(`Transaction ${payload.transactionId} is not pending. Status: ${transaction.status}`);
        return;
      }


      this.logger.info(`PIX Cronos create job processed successfully for transaction: ${payload.transactionId}`);
    } catch (error) {
      this.logger.error(`Error processing PIX Cronos create job: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      try {
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
      } catch (updateError) {
        this.logger.error(`Error updating transaction status: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
      }
      
      throw error;
    }
  }

  async handleConfirm(payload: {
    transactionId: string;
    userId: string;
  }): Promise<void> {
    this.logger.info(`Processing PIX Cronos confirm for transaction: ${payload.transactionId}`);

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
        this.logger.warn(`Transaction ${payload.transactionId} is not in process status. Status: ${transaction.status}`);
        return;
      }


      this.logger.info(`Simulating PIX transfer to Cronos API...`);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const cronosId = `cronos-${Date.now()}`;

      await this.prisma.transactions.update({
        where: { id: payload.transactionId },
        data: {
          cronosId,
          status: 'confirm' as transactions_status,
          updatedAt: new Date(),
        },
      });

      this.logger.info(`PIX Cronos confirm job processed successfully for transaction: ${payload.transactionId}. CronosId: ${cronosId}`);
    } catch (error) {
      this.logger.error(`Error processing PIX Cronos confirm job: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      try {
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
      } catch (updateError) {
        this.logger.error(`Error updating transaction status: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
      }
      
      throw error;
    }
  }
}

