import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class AccountModel {
  constructor(private prisma: PrismaService) {}

  async findById(accountId: string) {
    const account = await this.prisma.usersAccounts.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('users.errors.accountNotFound');
    }

    return account;
  }

  async findByUserId(userId: string) {
    return this.prisma.usersAccounts.findMany({
      where: {
        usersIdentities: { userId },
      },
      select: {
        id: true,
        type: true,
        balance: true,
        alias: true,
        status: true,
      },
    });
  }

  async findByUserIdFull(userId: string) {
    return this.prisma.usersAccounts.findMany({
      where: {
        usersIdentities: { userId },
      },
    });
  }

  async updateAlias(accountId: string, alias: string) {
    return this.prisma.usersAccounts.update({
      where: { id: accountId },
      data: { alias },
    });
  }

  async update(accountId: string, data: any) {
    return this.prisma.usersAccounts.update({
      where: { id: accountId },
      data,
    });
  }
}
