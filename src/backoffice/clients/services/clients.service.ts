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
  constructor(private prisma: PrismaService) {}  async list(query: ListClientsQueryDto): Promise<{
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
        where,
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
        },
      }),
      this.prisma.users.count({ where }),
    ]);

    return {
      data: data.map((user) => this.mapToResponse(user)),
      total,
      page,
      limit,
    };
  }  async getDetails(id: string): Promise<ClientDetailsDto> {
    const user = await this.prisma.users.findFirst({
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

    if (!user) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const baseResponse = this.mapToResponse(user);
    return {
      ...baseResponse,
      identities: user.usersIdentities_usersIdentities_userIdTousers.map((i) => ({
        id: i.id,
        type: i.type,
        country: i.country,
        taxDocumentNumber: i.taxDocumentNumber,
        status: i.status,
        createdAt: i.createdAt,
      })),
      accounts: user.usersAccounts.map((a) => ({
        id: a.id,
        type: a.type,
        currency: a.currency,
        balance: a.balance?.toString() || '0',
        status: a.status,
      })),
    };
  }  async update(id: string, dto: UpdateClientDto): Promise<ClientResponseDto> {
    const user = await this.prisma.users.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const updated = await this.prisma.users.update({
      where: { id },
      data: {
        name: dto.name ?? user.name,
        email: dto.email ?? user.email,
        phone: dto.phone ?? user.phone,
        status: dto.status ?? user.status,
        updatedAt: new Date(),
      },
      include: {
        usersIdentities_usersIdentities_userIdTousers: {
          where: { deletedAt: null },
        },
      },
    });

    return this.mapToResponse(updated);
  }  async block(id: string, dto: BlockClientDto): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.users.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Cliente não encontrado');
    }

    await this.prisma.users.update({
      where: { id },
      data: {
        isBlocked: true,
        blockedReason: dto.reason,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Cliente bloqueado com sucesso' };
  }  async unblock(id: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.users.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Cliente não encontrado');
    }

    await this.prisma.users.update({
      where: { id },
      data: {
        isBlocked: false,
        blockedReason: null,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Cliente desbloqueado com sucesso' };
  }  async disable(id: string, dto: BlockClientDto): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.users.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Cliente não encontrado');
    }

    await this.prisma.users.update({
      where: { id },
      data: {
        isDisabled: true,
        disabledReason: dto.reason,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Cliente desabilitado com sucesso' };
  }  async enable(id: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.users.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Cliente não encontrado');
    }

    await this.prisma.users.update({
      where: { id },
      data: {
        isDisabled: false,
        disabledReason: null,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Cliente habilitado com sucesso' };
  }  async getAccounts(id: string) {
    const user = await this.prisma.users.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const accounts = await this.prisma.usersAccounts.findMany({
      where: { userId: id, deletedAt: null },
    });

    return accounts.map((a) => ({
      id: a.id,
      type: a.type,
      currency: a.currency,
      balance: a.balance?.toString() || '0',
      status: a.status,
      createdAt: a.createdAt,
    }));
  }  async getLogs(id: string, query: { page?: number; limit?: number }) {
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
  }  async getTransactions(id: string, query: { page?: number; limit?: number }) {
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
    const enabledIdentities = identities.filter((i: any) => i.status === 'enable');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      clientOrigin: user.country,
      accountTypes: [...new Set(enabledIdentities.map((i: any) => i.type).filter(Boolean))] as string[],
      accountOrigins: [...new Set(enabledIdentities.map((i: any) => i.country).filter(Boolean))] as string[],
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
