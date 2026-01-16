import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { GetBillsDto } from '../dto/gire.dto';

@Injectable()
export class GireService {
  private readonly logger = new Logger(GireService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Search companies by name
   */
  async searchCompanies(name: string): Promise<any[]> {
    this.logger.log(`Searching GIRE companies: ${name}`);

    // This would call GIRE API to search companies
    // For now, return mock data
    return [
      {
        id: 'edenor',
        name: 'Edenor',
        code: 'EDENOR',
        category: 'utilities',
      },
      {
        id: 'edesur',
        name: 'Edesur',
        code: 'EDESUR',
        category: 'utilities',
      },
      {
        id: 'metrogas',
        name: 'MetroGas',
        code: 'METROGAS',
        category: 'utilities',
      },
    ].filter((c) => c.name.toLowerCase().includes(name.toLowerCase()));
  }

  /**
   * Get recharge companies
   */
  async getRechargeCompanies(): Promise<any[]> {
    this.logger.log('Getting GIRE recharge companies');

    return [
      { id: 'personal', name: 'Personal', category: 'mobile' },
      { id: 'movistar', name: 'Movistar', category: 'mobile' },
      { id: 'claro_ar', name: 'Claro', category: 'mobile' },
      { id: 'directv', name: 'DirecTV', category: 'entertainment' },
    ];
  }

  /**
   * Get recharge company details
   */
  async getRechargeCompanyById(id: string): Promise<any> {
    const companies = await this.getRechargeCompanies();
    const company = companies.find((c) => c.id === id);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return {
      ...company,
      minAmount: 100,
      maxAmount: 10000,
      denominations: [100, 200, 500, 1000, 2000, 5000],
    };
  }

  /**
   * Get payment modes for a company
   */
  async getPaymentModes(companyId: string): Promise<any> {
    this.logger.log(`Getting payment modes for company: ${companyId}`);

    return {
      companyId,
      modes: [
        { id: 'cbu', name: 'CBU Transfer', available: true },
        { id: 'debit', name: 'Debit', available: true },
      ],
    };
  }

  /**
   * Get bills by identifiers
   */
  async getBills(id1: string, id2: string, dto?: GetBillsDto): Promise<any[]> {
    this.logger.log(`Getting bills: ${id1}, ${id2}`);

    // This would call GIRE API
    return [
      {
        id: `${id1}-${id2}`,
        companyId: id1,
        companyName: 'Sample Company',
        amount: 1500.5,
        dueDate: new Date().toISOString(),
        barcode: `2345${id1}${id2}6789012345`,
        description: 'Monthly bill',
      },
    ];
  }

  /**
   * Get bill by barcode
   */
  async getBillByBarcode(barcode: string): Promise<any> {
    this.logger.log(`Getting bill by barcode: ${barcode}`);

    return {
      id: barcode,
      barcode,
      companyName: 'Company from Barcode',
      amount: 2500.0,
      dueDate: new Date().toISOString(),
      description: 'Bill payment',
    };
  }

  /**
   * Get operation status
   */
  async getOperationStatus(operationId: string): Promise<any> {
    this.logger.log(`Getting operation status: ${operationId}`);

    // Try to find in transactions
    const transaction = await this.prisma.transactions.findFirst({
      where: {
        OR: [{ gireId: operationId }, { id: operationId }],
      },
    });

    if (transaction) {
      return {
        operationId: transaction.gireId || transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        createdAt: transaction.createdAt,
        type: transaction.type,
      };
    }

    throw new NotFoundException('Operation not found');
  }

  /**
   * Get operation ticket
   */
  async getOperationTicket(operationId: string): Promise<any> {
    this.logger.log(`Getting operation ticket: ${operationId}`);

    const transaction = await this.prisma.transactions.findFirst({
      where: {
        OR: [{ gireId: operationId }, { id: operationId }],
      },
      select: {
        id: true,
        gireId: true,
        ticket: true,
        amount: true,
        status: true,
        createdAt: true,
        type: true,
        reason: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Operation not found');
    }

    return {
      operationId: transaction.gireId || transaction.id,
      ticket: transaction.ticket,
      amount: transaction.amount,
      status: transaction.status,
      type: transaction.type,
      reason: transaction.reason,
      createdAt: transaction.createdAt,
    };
  }

  /**
   * Process GIRE webhook
   */
  async processWebhook(
    method: string,
    action: string,
    data: any,
  ): Promise<any> {
    this.logger.log(`Processing GIRE webhook: ${method}/${action}`);

    // Handle different webhook types
    if (method === 'payment' && action === 'confirmed') {
      return this.handlePaymentConfirmed(data);
    }

    if (method === 'payment' && action === 'failed') {
      return this.handlePaymentFailed(data);
    }

    return {
      message: 'Webhook received',
      method,
      action,
      processed: true,
    };
  }

  private async handlePaymentConfirmed(data: any): Promise<any> {
    this.logger.log('Handling GIRE payment confirmed');

    if (data.gireId || data.operationId) {
      const transaction = await this.prisma.transactions.findFirst({
        where: {
          gireId: data.gireId || data.operationId,
        },
      });

      if (transaction) {
        await this.prisma.transactions.update({
          where: { id: transaction.id },
          data: {
            status: 'confirm',
            ticket: data.ticket,
            updatedAt: new Date(),
          },
        });
      }
    }

    return { message: 'Payment confirmed processed' };
  }

  private async handlePaymentFailed(data: any): Promise<any> {
    this.logger.log('Handling GIRE payment failed');

    if (data.gireId || data.operationId) {
      const transaction = await this.prisma.transactions.findFirst({
        where: {
          gireId: data.gireId || data.operationId,
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
      }
    }

    return { message: 'Payment failed processed' };
  }
}
