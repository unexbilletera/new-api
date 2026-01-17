import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  ListTransactionsQueryDto,
  TransactionFiltersDto,
} from '../dto/list-transactions.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * List transactions for a user
   */
  async listTransactions(
    userId: string,
    query: ListTransactionsQueryDto,
  ): Promise<any> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ sourceUserId: userId }, { targetUserId: userId }],
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.country) {
      where.country = query.country.toLowerCase();
    }

    if (query.currency) {
      where.currency = query.currency.toUpperCase();
    }

    if (query.startDate) {
      where.date = {
        ...(where.date || {}),
        gte: new Date(query.startDate),
      };
    }

    if (query.endDate) {
      where.date = {
        ...(where.date || {}),
        lte: new Date(query.endDate),
      };
    }

    if (query.minAmount !== undefined) {
      where.amount = {
        ...(where.amount || {}),
        gte: query.minAmount,
      };
    }

    if (query.maxAmount !== undefined) {
      where.amount = {
        ...(where.amount || {}),
        lte: query.maxAmount,
      };
    }

    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { reference: { contains: query.search } },
        { reason: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.transactions.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          date: true,
          number: true,
          code: true,
          type: true,
          status: true,
          amount: true,
          reason: true,
          country: true,
          currency: true,
          sourceUserId: true,
          targetUserId: true,
          sourceName: true,
          targetName: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.transactions.count({ where }),
    ]);

    const formattedData = data.map((tx) => ({
      ...tx,
      direction: tx.sourceUserId === userId ? 'out' : 'in',
      displayAmount:
        tx.sourceUserId === userId ? -Number(tx.amount) : Number(tx.amount),
    }));

    return {
      data: formattedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(
    transactionId: string,
    userId: string,
  ): Promise<any> {
    const transaction = await this.prisma.transactions.findFirst({
      where: {
        id: transactionId,
        OR: [{ sourceUserId: userId }, { targetUserId: userId }],
        deletedAt: null,
      },
      include: {
        users_transactions_sourceUserIdTousers: {
          select: { id: true, name: true, email: true },
        },
        users_transactions_targetUserIdTousers: {
          select: { id: true, name: true, email: true },
        },
        usersAccounts_transactions_sourceAccountIdTousersAccounts: {
          select: { id: true, type: true, cvu: true, alias: true },
        },
        usersAccounts_transactions_targetAccountIdTousersAccounts: {
          select: { id: true, type: true, cvu: true, alias: true },
        },
        transactions: {
          select: {
            id: true,
            type: true,
            status: true,
            amount: true,
            date: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      id: transaction.id,
      date: transaction.date,
      number: transaction.number,
      code: transaction.code,
      type: transaction.type,
      status: transaction.status,
      amount: transaction.amount,
      reason: transaction.reason,
      country: transaction.country,
      currency: transaction.currency,
      direction: transaction.sourceUserId === userId ? 'out' : 'in',
      source: {
        userId: transaction.sourceUserId,
        identityId: transaction.sourceIdentityId,
        name: transaction.sourceName,
        cvu: transaction.sourceCvu,
        alias: transaction.sourceAlias,
        user: transaction.users_transactions_sourceUserIdTousers,
        account:
          transaction.usersAccounts_transactions_sourceAccountIdTousersAccounts,
      },
      target: {
        userId: transaction.targetUserId,
        identityId: transaction.targetIdentityId,
        name: transaction.targetName,
        cvu: transaction.targetCvu,
        alias: transaction.targetAlias,
        user: transaction.users_transactions_targetUserIdTousers,
        account:
          transaction.usersAccounts_transactions_targetAccountIdTousersAccounts,
      },
      relatedTransaction: transaction.transactions,
      externalIds: {
        bindId: transaction.bindId,
        cronosId: transaction.cronosId,
        gireId: transaction.gireId,
        mantecaId: transaction.mantecaId,
        coelsaId: transaction.coelsaId,
      },
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  /**
   * Get transaction history with advanced filters
   */
  async getTransactionHistory(
    userId: string,
    query: ListTransactionsQueryDto,
    filters?: TransactionFiltersDto,
  ): Promise<any> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ sourceUserId: userId }, { targetUserId: userId }],
      deletedAt: null,
    };

    if (filters?.types) {
      const types = filters.types.split(',').map((t) => t.trim());
      where.type = { in: types };
    }

    if (filters?.statuses) {
      const statuses = filters.statuses.split(',').map((s) => s.trim());
      where.status = { in: statuses };
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.transactions.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: filters?.includeRelated
          ? {
              transactions: {
                select: {
                  id: true,
                  type: true,
                  status: true,
                  amount: true,
                },
              },
            }
          : undefined,
      }),
      this.prisma.transactions.count({ where }),
    ]);

    const groupedByDate = data.reduce((acc: any, tx) => {
      const dateKey = new Date(tx.date).toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push({
        ...tx,
        direction: tx.sourceUserId === userId ? 'out' : 'in',
      });
      return acc;
    }, {});

    return {
      data: groupedByDate,
      list: data.map((tx) => ({
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
   * Request transaction reversal
   */
  async requestReversal(
    transactionId: string,
    userId: string,
    reason: string,
  ): Promise<any> {
    const transaction = await this.prisma.transactions.findFirst({
      where: {
        id: transactionId,
        sourceUserId: userId,
        deletedAt: null,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const reversibleStatuses = ['confirm'];
    const reversibleTypes = [
      'cashout',
      'cashout_bind',
      'cashout_cronos',
      'transfer',
    ];

    if (!reversibleStatuses.includes(transaction.status)) {
      throw new NotFoundException(
        `Transaction cannot be reversed. Current status: ${transaction.status}`,
      );
    }

    if (!reversibleTypes.includes(transaction.type)) {
      throw new NotFoundException(
        `Transaction type ${transaction.type} cannot be reversed`,
      );
    }

    await this.prisma.transactionsLogs.create({
      data: {
        id: require('uuid').v4(),
        transactionId,
        userId,
        initialStatus: transaction.status,
        finalStatus: transaction.status, // Status doesn't change yet
        context: 'reversalRequest',
        params: JSON.stringify({ reason }),
        result: JSON.stringify({ requestSubmitted: true }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Reversal requested for transaction ${transactionId}`);

    return {
      success: true,
      transactionId,
      message: 'Reversal request submitted. It will be reviewed by our team.',
      requestedAt: new Date(),
    };
  }

  /**
   * Get transaction summary for user
   */
  async getTransactionSummary(
    userId: string,
    period: 'day' | 'week' | 'month' = 'month',
  ): Promise<any> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const transactions = await this.prisma.transactions.findMany({
      where: {
        OR: [{ sourceUserId: userId }, { targetUserId: userId }],
        date: { gte: startDate },
        deletedAt: null,
        status: 'confirm',
      },
      select: {
        id: true,
        type: true,
        amount: true,
        sourceUserId: true,
        currency: true,
      },
    });

    let totalIn = 0;
    let totalOut = 0;
    let countIn = 0;
    let countOut = 0;

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.sourceUserId === userId) {
        totalOut += amount;
        countOut++;
      } else {
        totalIn += amount;
        countIn++;
      }
    });

    return {
      period,
      startDate,
      endDate: new Date(),
      income: {
        total: totalIn,
        count: countIn,
      },
      expenses: {
        total: totalOut,
        count: countOut,
      },
      balance: totalIn - totalOut,
      transactionCount: transactions.length,
    };
  }
}
