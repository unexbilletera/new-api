import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);
  private readonly summaryPassphrase: string;
  private readonly summarySecret: string;
  private readonly historyPassphrase: string;
  private readonly historySecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.summaryPassphrase =
      this.configService.get<string>('BCRA_PASSPHRASE') || '';
    this.summarySecret = this.configService.get<string>('BCRA_SECRET') || '';
    this.historyPassphrase =
      this.configService.get<string>('BCRA_HISTORY_PASSPHRASE') ||
      this.summaryPassphrase;
    this.historySecret =
      this.configService.get<string>('BCRA_HISTORY_SECRET') ||
      this.summarySecret;
  }

  validateSummaryAuth(passphrase: string, secret: string): boolean {
    if (!passphrase || !secret) {
      return false;
    }
    return passphrase === this.summaryPassphrase && secret === this.summarySecret;
  }

  validateHistoryAuth(passphrase: string, secret: string): boolean {
    if (!passphrase || !secret) {
      return false;
    }
    return passphrase === this.historyPassphrase && secret === this.historySecret;
  }

  async getCvuSummary(passphrase: string, secret: string) {
    if (!this.validateSummaryAuth(passphrase, secret)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log('Generating CVU summary for compliance');

    const accounts = await this.prisma.usersAccounts.findMany({
      where: {
        deletedAt: null,
        type: 'bind',
      },
      select: {
        id: true,
        cvu: true,
        balance: true,
        status: true,
        createdAt: true,
      },
    });

    const summary = {
      totalAccounts: accounts.length,
      totalBalance: accounts.reduce(
        (sum, acc) => sum + Number(acc.balance || 0),
        0,
      ),
      activeAccounts: accounts.filter((a) => a.status === 'enable').length,
      generatedAt: new Date().toISOString(),
    };

    return summary;
  }

  async getCvuHistory(passphrase: string, secret: string) {
    if (!this.validateHistoryAuth(passphrase, secret)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log('Generating CVU history for compliance');

    const transactions = await this.prisma.transactions.findMany({
      where: {
        deletedAt: null,
        type: {
          in: ['cashin_coelsa', 'cashout_coelsa'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        createdAt: true,
        sourceAccountId: true,
        targetAccountId: true,
      },
    });

    return {
      transactions,
      count: transactions.length,
      generatedAt: new Date().toISOString(),
    };
  }
}
