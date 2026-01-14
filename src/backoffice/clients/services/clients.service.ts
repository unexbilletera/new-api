import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CacheService } from '../../../shared/performance/cache.service';
import {
  ListClientsQueryDto,
  UpdateClientDto,
  BlockClientDto,
  ClientResponseDto,
  ClientDetailsDto,
} from '../dto/clients.dto';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}
  async list(query: ListClientsQueryDto): Promise<{
    data: ClientResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const cacheKey = `clients:list:${JSON.stringify(query)}`;

    return this.cache.getOrSet(
      cacheKey,
      () => this.fetchClients(query),
      5 * 60 * 1000,
    );
  }

  private async fetchClients(query: ListClientsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = this.buildClientsWhere(query);

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
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          phone: true,
          country: true,
          status: true,
          lastLoginAt: true,
          isBlocked: true,
          blockedReason: true,
          isDisabled: true,
          disabledReason: true,
          createdAt: true,
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
              usersIdentities: {
                select: {
                  country: true,
                  type: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { lastLoginAt: 'desc' },
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

  private buildClientsWhere(query: ListClientsQueryDto): any {
    const where: any = {
      deletedAt: null,
    };

    if (query.status) {
      if (query.status === 'blocked') {
        where.isBlocked = true;
      } else if (query.status === 'disabled') {
        where.isDisabled = true;
      } else {
        where.status = query.status;
        where.isBlocked = false;
        where.isDisabled = false;
      }
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
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
  async getDetails(id: string): Promise<ClientDetailsDto> {
    const cacheKey = `client:${id}`;

    return this.cache.getOrSet(
      cacheKey,
      () => this.fetchClientDetails(id),
      10 * 60 * 1000,
    );
  }

  private async fetchClientDetails(id: string): Promise<ClientDetailsDto> {
    const user = await this.prisma.users.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        country: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        isBlocked: true,
        blockedReason: true,
        isDisabled: true,
        disabledReason: true,
        usersIdentities_usersIdentities_userIdTousers: {
          where: { deletedAt: null },
          select: {
            id: true,
            type: true,
            country: true,
            taxDocumentNumber: true,
            status: true,
            createdAt: true,
          },
        },
        usersAccounts: {
          where: { deletedAt: null, status: 'enable' },
          select: {
            id: true,
            type: true,
            status: true,
            balance: true,
            userIdentityId: true,
            usersIdentities: {
              select: {
                country: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Client not found');
    }

    const baseResponse = this.mapToResponse(user as any);
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
      accounts: user.usersAccounts.map((a) => ({
        id: a.id,
        type: a.type || null,
        balance: a.balance?.toString() || '0',
        status: a.status || null,
      })),
    };
  }
  async update(id: string, dto: UpdateClientDto): Promise<ClientResponseDto> {
    const user = await this.prisma.users.findFirst({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Client not found');
    }

    const updated = await this.prisma.users.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.status && { status: dto.status as any }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        country: true,
        status: true,
        createdAt: true,
        isBlocked: true,
        blockedReason: true,
        isDisabled: true,
        disabledReason: true,
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
          where: { deletedAt: null, status: 'enable' },
          select: {
            id: true,
            type: true,
            status: true,
            userIdentityId: true,
            usersIdentities: {
              select: {
                country: true,
                type: true,
              },
            },
          },
        },
      },
    });

    await this.invalidateClientCache(id);

    return this.mapToResponse(updated as any);
  }

  async block(
    id: string,
    dto: BlockClientDto,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.prisma.users.updateMany({
      where: { id, deletedAt: null },
      data: {
        isBlocked: true,
        blockedReason: dto.reason,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Client not found');
    }

    await this.invalidateClientCache(id);

    return { success: true, message: 'Client blocked successfully' };
  }

  async unblock(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.prisma.users.updateMany({
      where: { id, deletedAt: null },
      data: {
        isBlocked: false,
        blockedReason: null,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Client not found');
    }

    await this.invalidateClientCache(id);

    return { success: true, message: 'Client unblocked successfully' };
  }

  async disable(
    id: string,
    dto: BlockClientDto,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.prisma.users.updateMany({
      where: { id, deletedAt: null },
      data: {
        isDisabled: true,
        disabledReason: dto.reason,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Client not found');
    }

    await this.invalidateClientCache(id);

    return { success: true, message: 'Client disabled successfully' };
  }

  async enable(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.prisma.users.updateMany({
      where: { id, deletedAt: null },
      data: {
        isDisabled: false,
        disabledReason: null,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Client not found');
    }

    await this.invalidateClientCache(id);

    return { success: true, message: 'Client enabled successfully' };
  }
  async getAccounts(id: string) {
    const cacheKey = `client:${id}:accounts`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const user = await this.prisma.users.findFirst({
          where: { id },
          select: { id: true },
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
          select: {
            id: true,
            type: true,
            balance: true,
            status: true,
            createdAt: true,
          },
        });

        return accounts.map((a) => ({
          id: a.id,
          type: a.type || null,
          balance: a.balance?.toString() || '0',
          status: a.status || null,
          createdAt: a.createdAt,
        }));
      },
      5 * 60 * 1000,
    );
  }

  async getLogs(id: string, query: { page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.users_access_log.findMany({
        where: { userId: id },
        select: {
          id: true,
          ipAddress: true,
          device: true,
          finalStatus: true,
          createdAt: true,
        },
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
        where: { userId: id, deletedAt: null },
        select: {
          id: true,
          type: true,
          status: true,
          amount: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transactions.count({
        where: { userId: id, deletedAt: null },
      }),
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

  private async invalidateClientCache(clientId: string): Promise<void> {
    await this.cache.delete(`client:${clientId}`);
    await this.cache.delete(`client:${clientId}:accounts`);
    await this.cache.clearPattern('clients:list');
  }
}
