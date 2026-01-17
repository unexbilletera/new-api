import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { BindService } from '../../../shared/bind/bind.service';
import { TransactionFiltersDto } from '../dto/bind.dto';

@Injectable()
export class BindOperationsService {
  private readonly logger = new Logger(BindOperationsService.name);

  constructor(
    private prisma: PrismaService,
    private bindService: BindService,
  ) {}

  /**
   * List user's Bind accounts
   */
  async listAccounts(userId: string): Promise<any[]> {
    this.logger.log(`Listing Bind accounts for user ${userId}`);

    const accounts = await this.prisma.usersAccounts.findMany({
      where: {
        userId,
        type: 'bind',
        deletedAt: null,
      },
      select: {
        id: true,
        type: true,
        status: true,
        cvu: true,
        alias: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return accounts.map((acc) => ({
      ...acc,
      currency: 'ARS',
    }));
  }

  /**
   * Create CVU for user
   */
  async createCvu(
    userId: string,
    userIdentityId: string,
    alias?: string,
  ): Promise<any> {
    this.logger.log(`Creating CVU for user ${userId}`);

    const existingAccount = await this.prisma.usersAccounts.findFirst({
      where: {
        userIdentityId,
        type: 'bind',
        cvu: { not: null },
        deletedAt: null,
      },
    });

    if (existingAccount?.cvu) {
      return {
        success: true,
        cvu: existingAccount.cvu,
        alias: existingAccount.alias,
        message: 'CVU already exists for this user',
      };
    }

    const identity = await this.prisma.usersIdentities.findUnique({
      where: { id: userIdentityId },
      select: {
        id: true,
        taxDocumentNumber: true,
        name: true,
      },
    });

    if (!identity) {
      throw new BadRequestException('User identity not found');
    }

    if (!identity.taxDocumentNumber) {
      throw new BadRequestException(
        'User CUIT/CUIL not found. Please complete your identity verification.',
      );
    }

    const userName = identity.name?.trim();
    if (!userName) {
      throw new BadRequestException(
        'User name not found. Please complete your profile.',
      );
    }

    const clientId = identity.id;

    const cvuResult = await this.bindService.createCvu({
      client_id: clientId,
      cuit: identity.taxDocumentNumber,
      name: userName,
      currency: 'ARS',
    });

    let account = await this.prisma.usersAccounts.findFirst({
      where: {
        userIdentityId,
        type: 'bind',
        deletedAt: null,
      },
    });

    if (account) {
      await this.prisma.usersAccounts.update({
        where: { id: account.id },
        data: {
          cvu: cvuResult.cvu,
          alias: alias || cvuResult.alias,
          status: 'enable',
          updatedAt: new Date(),
        },
      });
    } else {
      account = await this.prisma.usersAccounts.create({
        data: {
          id: randomUUID(),
          userId,
          userIdentityId,
          type: 'bind',
          status: 'enable',
          cvu: cvuResult.cvu,
          alias: alias || cvuResult.alias,
          balance: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return {
      success: true,
      cvu: cvuResult.cvu,
      alias: alias || cvuResult.alias,
      message: 'CVU created successfully',
    };
  }

  /**
   * Get Bind account by ID
   */
  async getAccountById(userId: string, accountId: string): Promise<any> {
    const account = await this.prisma.usersAccounts.findFirst({
      where: {
        id: accountId,
        userId,
        type: 'bind',
        deletedAt: null,
      },
    });

    if (!account) {
      throw new NotFoundException('Bind account not found');
    }

    return {
      id: account.id,
      type: account.type,
      status: account.status,
      cvu: account.cvu,
      alias: account.alias,
      balance: account.balance,
      currency: 'ARS',
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  /**
   * List Bind transactions for user
   */
  async listTransactions(
    userId: string,
    filters?: TransactionFiltersDto,
  ): Promise<any> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ sourceUserId: userId }, { targetUserId: userId }],
      type: { in: ['cashin_bind', 'cashout_bind'] },
      deletedAt: null,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate) {
      where.date = { ...(where.date || {}), gte: new Date(filters.startDate) };
    }

    if (filters?.endDate) {
      where.date = { ...(where.date || {}), lte: new Date(filters.endDate) };
    }

    const [data, total] = await Promise.all([
      this.prisma.transactions.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          bindId: true,
          type: true,
          status: true,
          amount: true,
          date: true,
          reason: true,
          sourceUserId: true,
          targetUserId: true,
          sourceName: true,
          targetName: true,
          createdAt: true,
        },
      }),
      this.prisma.transactions.count({ where }),
    ]);

    return {
      data: data.map((tx) => ({
        ...tx,
        direction: tx.sourceUserId === userId ? 'out' : 'in',
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Bind transaction by ID
   */
  async getTransactionById(
    userId: string,
    transactionId: string,
  ): Promise<any> {
    const transaction = await this.prisma.transactions.findFirst({
      where: {
        AND: [
          {
            OR: [{ id: transactionId }, { bindId: transactionId }],
          },
          {
            OR: [{ sourceUserId: userId }, { targetUserId: userId }],
          },
        ],
        type: { in: ['cashin_bind', 'cashout_bind'] },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Bind transaction not found');
    }

    return {
      id: transaction.id,
      bindId: transaction.bindId,
      type: transaction.type,
      status: transaction.status,
      amount: transaction.amount,
      date: transaction.date,
      reason: transaction.reason,
      direction: transaction.sourceUserId === userId ? 'out' : 'in',
      source: {
        userId: transaction.sourceUserId,
        name: transaction.sourceName,
        cvu: transaction.sourceCvu,
      },
      target: {
        userId: transaction.targetUserId,
        name: transaction.targetName,
        cvu: transaction.targetCvu,
      },
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  /**
   * Get transaction by ID and date
   */
  async getTransactionByIdAndDate(
    userId: string,
    transactionId: string,
    date: string,
  ): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transaction = await this.prisma.transactions.findFirst({
      where: {
        OR: [{ id: transactionId }, { bindId: transactionId }],
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(
        'Transaction not found for the specified date',
      );
    }

    return {
      id: transaction.id,
      bindId: transaction.bindId,
      type: transaction.type,
      status: transaction.status,
      amount: transaction.amount,
      date: transaction.date,
    };
  }

  /**
   * List Bind transfers (CVU transfers)
   */
  async listTransfers(
    userId: string,
    filters?: TransactionFiltersDto,
  ): Promise<any> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ sourceUserId: userId }, { targetUserId: userId }],
      type: { in: ['cashout_bind', 'cashin_bind', 'transfer'] },
      bindId: { not: null },
      deletedAt: null,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.transactions.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          bindId: true,
          status: true,
          amount: true,
          sourceCvu: true,
          targetCvu: true,
          sourceName: true,
          targetName: true,
          createdAt: true,
        },
      }),
      this.prisma.transactions.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get transfer by ID
   */
  async getTransferById(userId: string, transferId: string): Promise<any> {
    const transfer = await this.prisma.transactions.findFirst({
      where: {
        OR: [{ id: transferId }, { bindId: transferId }],
        bindId: { not: null },
      },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    return {
      id: transfer.id,
      bindId: transfer.bindId,
      status: transfer.status,
      amount: transfer.amount,
      sourceCvu: transfer.sourceCvu,
      targetCvu: transfer.targetCvu,
      sourceName: transfer.sourceName,
      targetName: transfer.targetName,
      createdAt: transfer.createdAt,
    };
  }

  /**
   * Process Bind webhook
   */
  async processWebhook(
    method: string,
    action: string,
    data: any,
  ): Promise<any> {
    this.logger.log(`Processing Bind webhook: ${method}/${action}`);

    const eventKey = `${method}_${action}`.toLowerCase();

    switch (eventKey) {
      case 'transfer_completed':
      case 'cvu_transfer_completed':
        return this.handleTransferCompleted(data);
      case 'transfer_failed':
      case 'cvu_transfer_failed':
        return this.handleTransferFailed(data);
      case 'cashin_received':
        return this.handleCashinReceived(data);
      default:
        this.logger.warn(`Unknown Bind webhook: ${eventKey}`);
        return { message: `Unknown event: ${eventKey}`, processed: false };
    }
  }

  private async handleTransferCompleted(data: any): Promise<any> {
    this.logger.log('Handling Bind transfer completed');

    if (data.bindId || data.id) {
      const transaction = await this.prisma.transactions.findFirst({
        where: {
          bindId: data.bindId || data.id,
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
      }
    }

    return { message: 'Transfer completed processed' };
  }

  private async handleTransferFailed(data: any): Promise<any> {
    this.logger.log('Handling Bind transfer failed');

    if (data.bindId || data.id) {
      const transaction = await this.prisma.transactions.findFirst({
        where: {
          bindId: data.bindId || data.id,
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

    return { message: 'Transfer failed processed' };
  }

  private async handleCashinReceived(data: any): Promise<any> {
    this.logger.log('Handling Bind cashin received');
    return { message: 'Cashin received processed', data };
  }

  /**
   * Proxy request to Bind API (admin)
   */
  async proxyRequest(body: any): Promise<any> {
    this.logger.log('Proxying request to Bind');
    return {
      message: 'Proxy request not implemented',
      body,
    };
  }
}
