import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class CoelsaService {
  private readonly logger = new Logger(CoelsaService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get operation status
   */
  async getOperationStatus(operationId: string): Promise<any> {
    this.logger.log(`Getting COELSA operation status: ${operationId}`);

    const transaction = await this.prisma.transactions.findFirst({
      where: {
        OR: [{ coelsaId: operationId }, { id: operationId }],
      },
    });

    if (transaction) {
      return {
        id: transaction.id,
        coelsaId: transaction.coelsaId,
        status: transaction.status,
        amount: transaction.amount,
        type: transaction.type,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };
    }

    throw new NotFoundException('Operation not found');
  }

  /**
   * Search merchant by CUIT
   */
  async getMerchantByCuit(cuit: string): Promise<any> {
    this.logger.log(`Searching merchant by CUIT: ${cuit}`);

    return {
      cuit,
      name: `Merchant ${cuit}`,
      cbu: `0000000000000${cuit}00000`,
      alias: `merchant.${cuit}`,
      bank: 'Banco de la Nación Argentina',
      validated: true,
    };
  }

  /**
   * Process COELSA webhook
   */
  async processWebhook(action: string, data: any): Promise<any> {
    this.logger.log(`Processing COELSA webhook: ${action}`);

    switch (action) {
      case 'transfer_completed':
        return this.handleTransferCompleted(data);
      case 'transfer_failed':
        return this.handleTransferFailed(data);
      case 'transfer_reversed':
        return this.handleTransferReversed(data);
      default:
        this.logger.warn(`Unknown COELSA webhook action: ${action}`);
        return { message: `Unknown action: ${action}`, processed: false };
    }
  }

  private async handleTransferCompleted(data: any): Promise<any> {
    this.logger.log('Handling COELSA transfer completed');

    if (data.coelsaId || data.operationId) {
      const transaction = await this.prisma.transactions.findFirst({
        where: {
          coelsaId: data.coelsaId || data.operationId,
        },
      });

      if (transaction) {
        await this.prisma.transactions.update({
          where: { id: transaction.id },
          data: {
            status: 'confirm',
            updatedAt: new Date(),
          },
        });

        return {
          message: 'Transfer completed processed',
          transactionId: transaction.id,
        };
      }
    }

    return { message: 'Transfer completed webhook received' };
  }

  private async handleTransferFailed(data: any): Promise<any> {
    this.logger.log('Handling COELSA transfer failed');

    if (data.coelsaId || data.operationId) {
      const transaction = await this.prisma.transactions.findFirst({
        where: {
          coelsaId: data.coelsaId || data.operationId,
        },
      });

      if (transaction) {
        await this.prisma.transactions.update({
          where: { id: transaction.id },
          data: {
            status: 'error',
            updatedAt: new Date(),
          },
        });

        return {
          message: 'Transfer failed processed',
          transactionId: transaction.id,
        };
      }
    }

    return { message: 'Transfer failed webhook received' };
  }

  private async handleTransferReversed(data: any): Promise<any> {
    this.logger.log('Handling COELSA transfer reversed');

    if (data.coelsaId || data.operationId) {
      const transaction = await this.prisma.transactions.findFirst({
        where: {
          coelsaId: data.coelsaId || data.operationId,
        },
      });

      if (transaction) {
        await this.prisma.transactions.update({
          where: { id: transaction.id },
          data: {
            status: 'reverse',
            reverseCoelsaId: data.reverseId,
            updatedAt: new Date(),
          },
        });

        return {
          message: 'Transfer reversed processed',
          transactionId: transaction.id,
        };
      }
    }

    return { message: 'Transfer reversed webhook received' };
  }

  /**
   * Proxy request to COELSA API (admin)
   */
  async proxyRequest(api: string, body?: any): Promise<any> {
    this.logger.log(`Proxying request to COELSA: ${api}`);
    return {
      message: 'Proxy request not implemented',
      api,
    };
  }

  /**
   * Echo/test endpoint
   */
  async echo(api: string, type?: string): Promise<any> {
    return {
      api,
      type: type || 'default',
      timestamp: new Date().toISOString(),
      message: 'COELSA echo response',
    };
  }
}
