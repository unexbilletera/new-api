import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@Injectable()
export class UsersDataService {
  constructor(private readonly prisma: PrismaService) {}

  // Users Identities
  async searchIdentities(query: SearchQueryDto, userId?: string) {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      status,
    } = query;

    const skip = (page - 1) * pageSize;
    const where: any = { deletedAt: null };

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { taxDocumentNumber: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.usersIdentities.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.usersIdentities.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async selectIdentity(id: string, userId?: string) {
    const where: any = { id, deletedAt: null };
    if (userId) {
      where.userId = userId;
    }

    const identity = await this.prisma.usersIdentities.findFirst({ where });

    if (!identity) {
      throw new NotFoundException(`Identity with id ${id} not found`);
    }

    return identity;
  }

  async createIdentity(data: any, userId: string) {
    const now = new Date();
    return this.prisma.usersIdentities.create({
      data: {
        ...data,
        id: data.id || this.generateUUID(),
        userId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async updateIdentity(id: string, data: any, userId?: string) {
    const where: any = { id, deletedAt: null };
    if (userId) {
      where.userId = userId;
    }

    const existing = await this.prisma.usersIdentities.findFirst({ where });
    if (!existing) {
      throw new NotFoundException(`Identity with id ${id} not found`);
    }

    return this.prisma.usersIdentities.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async selectIdentityByField(id: string, field: string, value: string) {
    const identity = await this.prisma.usersIdentities.findFirst({
      where: { id, [field]: value, deletedAt: null },
    });

    if (!identity) {
      throw new NotFoundException(`Identity with id ${id} and ${field}=${value} not found`);
    }

    return identity;
  }

  async updateIdentityField(id: string, field: string, value: any) {
    const existing = await this.prisma.usersIdentities.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Identity with id ${id} not found`);
    }

    return this.prisma.usersIdentities.update({
      where: { id },
      data: { [field]: value, updatedAt: new Date() },
    });
  }

  // Users Identities Grants
  async searchGrants(query: SearchQueryDto, userId?: string) {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
    } = query;

    const skip = (page - 1) * pageSize;
    const where: any = { deletedAt: null };

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.usersIdentitiesGrants.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.usersIdentitiesGrants.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async selectGrant(id: string, userId?: string) {
    const where: any = { id, deletedAt: null };
    if (userId) {
      where.userId = userId;
    }

    const grant = await this.prisma.usersIdentitiesGrants.findFirst({ where });

    if (!grant) {
      throw new NotFoundException(`Grant with id ${id} not found`);
    }

    return grant;
  }

  async createGrant(data: any, userId: string) {
    const now = new Date();
    return this.prisma.usersIdentitiesGrants.create({
      data: {
        ...data,
        id: data.id || this.generateUUID(),
        userId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async updateGrant(id: string, data: any, userId?: string) {
    const where: any = { id, deletedAt: null };
    if (userId) {
      where.userId = userId;
    }

    const existing = await this.prisma.usersIdentitiesGrants.findFirst({ where });
    if (!existing) {
      throw new NotFoundException(`Grant with id ${id} not found`);
    }

    return this.prisma.usersIdentitiesGrants.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  // Users Accounts
  async searchAccounts(query: SearchQueryDto, userId?: string) {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
    } = query;

    const skip = (page - 1) * pageSize;
    const where: any = { deletedAt: null };

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.usersAccounts.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.usersAccounts.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async selectAccount(id: string, userId?: string) {
    const where: any = { id, deletedAt: null };
    if (userId) {
      where.userId = userId;
    }

    const account = await this.prisma.usersAccounts.findFirst({ where });

    if (!account) {
      throw new NotFoundException(`Account with id ${id} not found`);
    }

    return account;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
