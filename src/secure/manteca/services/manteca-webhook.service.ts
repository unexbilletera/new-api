import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface WebhookEvent {
  event: string;
  data: any;
  timestamp?: string;
}

@Injectable()
export class MantecaWebhookService {
  private readonly logger = new Logger(MantecaWebhookService.name);
  private webhookSecret: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.webhookSecret =
      this.configService.get<string>('WALLET_MANTECA_WEBHOOK_SECRET') || '';
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('Webhook secret not configured');
      return true; // Allow in development
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      this.logger.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(event: WebhookEvent): Promise<any> {
    this.logger.log(`Processing webhook event: ${event.event}`);

    switch (event.event) {
      case 'SYNTHETIC_STATUS_UPDATE':
        return this.processSyntheticStatusUpdate(event.data);
      case 'WITHDRAW_STATUS_UPDATE':
        return this.processWithdrawStatusUpdate(event.data);
      case 'ORDER_STATUS_UPDATE':
        return this.processOrderStatusUpdate(event.data);
      case 'DEPOSIT_STATUS_UPDATE':
        return this.processDepositStatusUpdate(event.data);
      default:
        this.logger.warn(`Unknown webhook event: ${event.event}`);
        return { message: `Unknown event: ${event.event}`, processed: false };
    }
  }

  /**
   * Process SYNTHETIC_STATUS_UPDATE webhook
   */
  private async processSyntheticStatusUpdate(data: any): Promise<any> {
    this.logger.log(`Processing SYNTHETIC_STATUS_UPDATE for ID: ${data.id}`);

    if (!data || !data.id) {
      throw new BadRequestException('Invalid synthetic data: missing id');
    }

    const mantecaSyntheticId = data.id;
    const mantecaStatus = data.status;

    // Find transaction by mantecaId
    const transaction = await this.prisma.transactions.findFirst({
      where: { mantecaId: mantecaSyntheticId },
    });

    if (!transaction) {
      this.logger.warn(
        `No transaction found with mantecaId: ${mantecaSyntheticId}`,
      );

      // Check if it's a ramp operation
      const rampOperation = await this.prisma.ramp_operations.findFirst({
        where: { manteca_operation_id: mantecaSyntheticId },
      });

      if (rampOperation) {
        // Update ramp operation status
        const newStatus = this.mapMantecaStatusToRampStatus(mantecaStatus);
        await this.prisma.ramp_operations.update({
          where: { id: rampOperation.id },
          data: {
            status: newStatus as any,
            stages_data: data.stages || data,
            updated_at: new Date(),
            ...(mantecaStatus === 'COMPLETED'
              ? { manteca_confirmed_at: new Date() }
              : {}),
          },
        });

        return {
          message: 'Ramp operation updated',
          operationId: rampOperation.id,
          status: newStatus,
        };
      }

      return {
        message: 'No transaction found for this synthetic',
        syntheticId: mantecaSyntheticId,
        status: mantecaStatus,
      };
    }

    // Map Manteca status to transaction status
    const newStatus = this.mapMantecaStatusToTransactionStatus(
      mantecaStatus,
      transaction.type,
    );

    // Update transaction
    await this.prisma.transactions.update({
      where: { id: transaction.id },
      data: {
        status: newStatus as any,
        updatedAt: new Date(),
      },
    });

    // Log the update
    await this.prisma.transactionsLogs.create({
      data: {
        id: uuidv4(),
        transactionId: transaction.id,
        userId: transaction.sourceUserId,
        initialStatus: transaction.status,
        finalStatus: newStatus as any,
        context: 'mantecaWebhook',
        params: JSON.stringify({ event: 'SYNTHETIC_STATUS_UPDATE', data }),
        result: JSON.stringify({ success: true, newStatus }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `Transaction ${transaction.id} updated to status: ${newStatus}`,
    );

    return {
      message: 'Transaction updated successfully',
      transactionId: transaction.id,
      previousStatus: transaction.status,
      newStatus,
    };
  }

  /**
   * Process WITHDRAW_STATUS_UPDATE webhook
   */
  private async processWithdrawStatusUpdate(data: any): Promise<any> {
    this.logger.log(`Processing WITHDRAW_STATUS_UPDATE for ID: ${data.id}`);

    if (!data || !data.id) {
      throw new BadRequestException('Invalid withdraw data: missing id');
    }

    const withdrawId = data.id;
    const withdrawStatus = data.status;

    // Only process final statuses
    const finalStatuses = ['EXECUTED', 'CANCELLED', 'FAILED'];
    if (!finalStatuses.includes(withdrawStatus)) {
      return {
        message: 'Withdraw status is not final - no update needed',
        withdrawId,
        status: withdrawStatus,
      };
    }

    // Try to find transaction by mantecaId or externalId
    let transaction = await this.prisma.transactions.findFirst({
      where: {
        mantecaId: withdrawId,
        status: { in: ['pending', 'process'] },
      },
    });

    // Try using externalId if not found
    if (!transaction && data.externalId) {
      const baseTransactionId = data.externalId.replace(/-rampOff$/, '');
      transaction = await this.prisma.transactions.findUnique({
        where: { id: baseTransactionId },
      });
    }

    if (!transaction) {
      this.logger.warn(`No transaction found for withdraw: ${withdrawId}`);
      return {
        message: 'No matching transaction found',
        withdrawId,
        status: withdrawStatus,
      };
    }

    // Map status
    const newStatus = this.mapWithdrawStatusToTransactionStatus(withdrawStatus);

    // Update transaction
    await this.prisma.transactions.update({
      where: { id: transaction.id },
      data: {
        status: newStatus as any,
        updatedAt: new Date(),
      },
    });

    // Log the update
    await this.prisma.transactionsLogs.create({
      data: {
        id: uuidv4(),
        transactionId: transaction.id,
        userId: transaction.sourceUserId,
        initialStatus: transaction.status,
        finalStatus: newStatus as any,
        context: 'mantecaWebhook',
        params: JSON.stringify({ event: 'WITHDRAW_STATUS_UPDATE', data }),
        result: JSON.stringify({ success: true, newStatus }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `Transaction ${transaction.id} updated from withdraw webhook`,
    );

    return {
      message: 'Transaction updated from withdraw webhook',
      transactionId: transaction.id,
      newStatus,
    };
  }

  /**
   * Process ORDER_STATUS_UPDATE webhook
   */
  private async processOrderStatusUpdate(data: any): Promise<any> {
    this.logger.log(`Processing ORDER_STATUS_UPDATE for ID: ${data.id}`);

    // Orders are part of Synthetics, so SYNTHETIC_STATUS_UPDATE is primary
    return {
      message:
        'ORDER_STATUS_UPDATE received - processing via Synthetic status is recommended',
      orderId: data.id,
      status: data.status,
    };
  }

  /**
   * Process DEPOSIT_STATUS_UPDATE webhook
   */
  private async processDepositStatusUpdate(data: any): Promise<any> {
    this.logger.log(`Processing DEPOSIT_STATUS_UPDATE for ID: ${data.id}`);

    // Check if this relates to a ramp operation
    const rampOperation = await this.prisma.ramp_operations.findFirst({
      where: {
        OR: [
          { manteca_operation_id: data.syntheticId },
          { manteca_external_id: data.externalId },
        ],
      },
    });

    if (rampOperation) {
      await this.prisma.ramp_operations.update({
        where: { id: rampOperation.id },
        data: {
          status: 'WAITING_DEPOSIT',
          bank_webhook_received: true,
          bank_webhook_id: data.id,
          updated_at: new Date(),
        },
      });

      return {
        message: 'Ramp operation updated from deposit webhook',
        operationId: rampOperation.id,
      };
    }

    return {
      message: 'Deposit webhook processed',
      depositId: data.id,
    };
  }

  /**
   * Map Manteca status to transaction status
   */
  private mapMantecaStatusToTransactionStatus(
    mantecaStatus: string,
    transactionType: string,
  ): string {
    switch (mantecaStatus) {
      case 'COMPLETED':
      case 'SETTLED':
        return 'confirm';
      case 'CANCELLED':
      case 'FAILED':
        // For exchange transactions that fail
        if (
          transactionType.includes('exchange') ||
          transactionType.includes('qr')
        ) {
          return 'reverse_manteca';
        }
        return 'error';
      case 'PROCESSING':
      case 'WAITING_DEPOSIT':
      case 'ORDER_EXECUTED':
        return 'process';
      default:
        return 'pending';
    }
  }

  /**
   * Map Manteca status to ramp operation status
   */
  private mapMantecaStatusToRampStatus(mantecaStatus: string): string {
    switch (mantecaStatus) {
      case 'COMPLETED':
      case 'SETTLED':
        return 'SETTLED';
      case 'CANCELLED':
        return 'CANCELLED';
      case 'FAILED':
        return 'FAILED';
      case 'ORDER_EXECUTED':
        return 'ORDER_EXECUTED';
      case 'WITHDRAW_REQUESTED':
        return 'WITHDRAW_REQUESTED';
      case 'WAITING_DEPOSIT':
        return 'WAITING_DEPOSIT';
      default:
        return 'STARTING';
    }
  }

  /**
   * Map withdraw status to transaction status
   */
  private mapWithdrawStatusToTransactionStatus(withdrawStatus: string): string {
    switch (withdrawStatus) {
      case 'EXECUTED':
        return 'confirm';
      case 'CANCELLED':
      case 'FAILED':
        return 'reverse_manteca';
      default:
        return 'process';
    }
  }

  /**
   * Test webhook (for development/testing)
   */
  async testWebhook(event: WebhookEvent): Promise<any> {
    this.logger.log(`Test webhook received: ${event.event}`);
    return {
      message: 'Test webhook received',
      event: event.event,
      data: event.data,
      timestamp: new Date().toISOString(),
    };
  }
}
