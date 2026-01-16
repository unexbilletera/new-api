import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchQueryDto, userId?: string) {
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
      where.OR = [{ name: { contains: search } }];
    }

    const [data, total] = await Promise.all([
      this.prisma.credits.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.credits.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async select(id: string, userId?: string) {
    const where: any = { id, deletedAt: null };
    if (userId) {
      where.userId = userId;
    }

    const credit = await this.prisma.credits.findFirst({ where });

    if (!credit) {
      throw new NotFoundException(`Credit with id ${id} not found`);
    }

    return credit;
  }

  async create(data: any, userId: string) {
    const now = new Date();
    return this.prisma.credits.create({
      data: {
        ...data,
        id: data.id || this.generateUUID(),
        userId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async update(id: string, data: any, userId?: string) {
    const where: any = { id, deletedAt: null };
    if (userId) {
      where.userId = userId;
    }

    const existing = await this.prisma.credits.findFirst({ where });
    if (!existing) {
      throw new NotFoundException(`Credit with id ${id} not found`);
    }

    return this.prisma.credits.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.credits.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Credit with id ${id} not found`);
    }

    return this.prisma.credits.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async selectByField(id: string, field: string, value: string) {
    const credit = await this.prisma.credits.findFirst({
      where: {
        id,
        [field]: value,
        deletedAt: null,
      },
    });

    if (!credit) {
      throw new NotFoundException(
        `Credit with id ${id} and ${field}=${value} not found`,
      );
    }

    return credit;
  }

  async updateField(id: string, field: string, value: any) {
    const existing = await this.prisma.credits.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Credit with id ${id} not found`);
    }

    return this.prisma.credits.update({
      where: { id },
      data: {
        [field]: value,
        updatedAt: new Date(),
      },
    });
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }
}
