import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchQueryDto) {
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

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.stores.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          storesCategories: {
            include: { categories: { select: { id: true, name: true } } },
          },
        },
      }),
      this.prisma.stores.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async select(id: string) {
    const store = await this.prisma.stores.findFirst({
      where: { id, deletedAt: null },
      include: {
        storesCategories: {
          include: { categories: { select: { id: true, name: true } } },
        },
        branches: { where: { deletedAt: null } },
        benefits: { where: { deletedAt: null } },
      },
    });

    if (!store) {
      throw new NotFoundException(`Store with id ${id} not found`);
    }

    return store;
  }

  async create(data: any) {
    const now = new Date();
    return this.prisma.stores.create({
      data: {
        ...data,
        id: data.id || this.generateUUID(),
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.stores.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Store with id ${id} not found`);
    }

    return this.prisma.stores.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.stores.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Store with id ${id} not found`);
    }

    return this.prisma.stores.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async selectByField(id: string, field: string, value: string) {
    const store = await this.prisma.stores.findFirst({
      where: {
        id,
        [field]: value,
        deletedAt: null,
      },
    });

    if (!store) {
      throw new NotFoundException(
        `Store with id ${id} and ${field}=${value} not found`,
      );
    }

    return store;
  }

  async updateField(id: string, field: string, value: any) {
    const existing = await this.prisma.stores.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Store with id ${id} not found`);
    }

    return this.prisma.stores.update({
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
