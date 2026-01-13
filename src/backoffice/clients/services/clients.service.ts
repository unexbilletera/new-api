import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  ListClientsQueryDto,
  UpdateClientDto,
  BlockClientDto,
  ClientResponseDto,
  ClientDetailsDto,
} from '../dto/clients.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}
  async list(query: ListClientsQueryDto): Promise<{
    data: ClientResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (query.status && !['blocked', 'disabled'].includes(query.status)) {
      where.status = query.status;
    }

    if (query.status === 'blocked') {
      where.isBlocked = true;
    } else if (query.status === 'disabled') {
      where.isDisabled = true;
    } else {
      where.isBlocked = false;
      where.isDisabled = false;
    }

    if (query.startDate || query.endDate) {
      where.lastLoginAt = {};
      if (query.startDate) {
        where.lastLoginAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.lastLoginAt.lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
        { username: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.users.findMany({
        where: {
          ...where,
          usersAccounts: {
            some: {
              deletedAt: null,
              status: 'enable',
            },
          },
        },
        skip,
        take: limit,
        orderBy: { lastLoginAt: 'desc' },
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
          usersAccounts: {
            where: {
              deletedAt: null,
              status: 'enable',
            },
            select: {
              id: true,
              type: true,
              status: true,
              userIdentityId: true,
            },
            include: {
              usersIdentities: {
                select: {
                  country: true,
                  type: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.users.count({
        where: {
          ...where,
          usersAccounts: {
            some: {
              deletedAt: null,
              status: 'enable',
            },
          },
        },
      }),
    ]);

    return {
      data: data.map((user) => this.mapToResponse(user)),
      total,
      page,
      limit,
    };
  }
  async getDetails(id: string): Promise<ClientDetailsDto> {
    const user = await this.prisma.users.findFirst({
      where: { id, deletedAt: null },
      include: {
        usersIdentities_usersIdentities_userIdTousers: {
          where: { deletedAt: null },
        },
        usersAccounts: {
          where: {
            deletedAt: null,
            status: 'enable',
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Client not found');
    }

    const baseResponse = this.mapToResponse(user);
    return {
      ...baseResponse,
      identities: user.usersIdentities_usersIdentities_userIdTousers.map(
        (i) => ({
          id: i.id,
          type: i.type,
          country: i.country,
          taxDocumentNumber: i.taxDocumentNumber,
          status: i.status,
          createdAt: i.createdAt,
        }),
      ),
      accounts: user.usersAccounts
        .filter((a) => a.status === 'enable')
        .map((a) => ({
          id: a.id,
          type: a.type || null,
          balance: a.balance?.toString() || '0',
          status: a.status || null,
        })),
    };
  }
  async update(id: string, dto: UpdateClientDto): Promise<ClientResponseDto> {
    const user = await this.prisma.users.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Client not found');
    }

    const updated = await this.prisma.users.update({
      where: { id },
      data: {
        name: dto.name ?? user.name,
        email: dto.email ?? user.email,
        phone: dto.phone ?? user.phone,
        status: (dto.status ?? user.status) as any,
        updatedAt: new Date(),
      },
      include: {
        usersIdentities_usersIdentities_userIdTousers: {
          where: { deletedAt: null },
        },
      },
    });

    return this.mapToResponse(updated);
  }
  async block(
    id: string,
    dto: BlockClientDto,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.users.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Client not found');
    }

    await this.prisma.users.update({
      where: { id },
      data: {
        isBlocked: true,
        blockedReason: dto.reason,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Client blocked successfully' };
  }
  async unblock(id: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.users.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Client not found');
    }

    await this.prisma.users.update({
      where: { id },
      data: {
        isBlocked: false,
        blockedReason: null,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Client unblocked successfully' };
  }
  async disable(
    id: string,
    dto: BlockClientDto,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.users.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Client not found');
    }

    await this.prisma.users.update({
      where: { id },
      data: {
        isDisabled: true,
        disabledReason: dto.reason,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Client disabled successfully' };
  }
  async enable(id: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.users.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Client not found');
    }

    await this.prisma.users.update({
      where: { id },
      data: {
        isDisabled: false,
        disabledReason: null,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Client enabled successfully' };
  }
  async getAccounts(id: string) {
    const user = await this.prisma.users.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Client not found');
    }

    const accounts = await this.prisma.usersAccounts.findMany({
      where: {
        userId: id,
        deletedAt: null,
        status: 'enable',
      },
    });

    return accounts.map((a) => ({
      id: a.id,
      type: a.type || null,
      balance: a.balance?.toString() || '0',
      status: a.status || null,
      createdAt: a.createdAt,
    }));
  }
  async getLogs(id: string, query: { page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.users_access_log.findMany({
        where: { userId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.users_access_log.count({ where: { userId: id } }),
    ]);

    return { data, total, page, limit };
  }
  async getTransactions(id: string, query: { page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.transactions.findMany({
        where: { userId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transactions.count({ where: { userId: id } }),
    ]);

    return { data, total, page, limit };
  }

  private mapToResponse(user: any): ClientResponseDto {
    const identities = user.usersIdentities_usersIdentities_userIdTousers || [];
    const enabledIdentities = identities.filter(
      (i: any) => i.status === 'enable',
    );

    const activeAccounts = (user.usersAccounts || []).filter(
      (a: any) => a.status === 'enable',
    );

    const accountOriginsFromAccounts = activeAccounts
      .map((a: any) => a.usersIdentities?.country)
      .filter(Boolean);

    const accountTypesFromAccounts = activeAccounts
      .map((a: any) => a.type)
      .filter(Boolean);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      clientOrigin: user.country,
      accountTypes: [...new Set(accountTypesFromAccounts)] as string[],
      accountOrigins: [...new Set(accountOriginsFromAccounts)] as string[],
      documentNumbers: identities
        .filter((i: any) => i.taxDocumentNumber)
        .map((i: any) => ({ country: i.country, number: i.taxDocumentNumber })),
      status: user.status,
      isBlocked: user.isBlocked || false,
      blockedReason: user.blockedReason,
      isDisabled: user.isDisabled || false,
      disabledReason: user.disabledReason,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
