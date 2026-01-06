import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class ClientModel {
  constructor(private prisma: PrismaService) {}

  async list(where: any, skip: number, take: number, orderBy: any) {
    return this.prisma.users.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        usersIdentities_usersIdentities_userIdTousers: {
          where: { deletedAt: null },
          select: {
            id: true,
            type: true,
            country: true,
            taxDocumentNumber: true,
            status: true,
          },
        },
      },
    });
  }

  async count(where: any) {
    return this.prisma.users.count({ where });
  }

  async findById(id: string) {
    return this.prisma.users.findFirst({
      where: { id, deletedAt: null },
      include: {
        usersIdentities_usersIdentities_userIdTousers: {
          where: { deletedAt: null },
        },
        usersAccounts: {
          where: { deletedAt: null },
        },
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.users.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async block(id: string, reason: string) {
    return this.prisma.users.update({
      where: { id },
      data: {
        isBlocked: true,
        blockReason: reason,
        blockedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async unblock(id: string) {
    return this.prisma.users.update({
      where: { id },
      data: {
        isBlocked: false,
        blockReason: null,
        blockedAt: null,
        updatedAt: new Date(),
      },
    });
  }

  async disable(id: string) {
    return this.prisma.users.update({
      where: { id },
      data: {
        isDisabled: true,
        disabledAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async enable(id: string) {
    return this.prisma.users.update({
      where: { id },
      data: {
        isDisabled: false,
        disabledAt: null,
        updatedAt: new Date(),
      },
    });
  }
}
