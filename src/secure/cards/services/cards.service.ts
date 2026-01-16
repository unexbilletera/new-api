import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@Injectable()
export class CardsService {
  private readonly modelName = 'cards';

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
      where.OR = [
        { name: { contains: search } },
        { number: { contains: search } },
        { tokenId: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.cards.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          users: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.cards.count({ where }),
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

    const card = await this.prisma.cards.findFirst({
      where,
      include: {
        users: { select: { id: true, name: true, email: true } },
      },
    });

    if (!card) {
      throw new NotFoundException(`Card with id ${id} not found`);
    }

    return card;
  }

  async create(data: any, userId: string) {
    const now = new Date();
    return this.prisma.cards.create({
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

    const existing = await this.prisma.cards.findFirst({ where });
    if (!existing) {
      throw new NotFoundException(`Card with id ${id} not found`);
    }

    return this.prisma.cards.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.cards.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Card with id ${id} not found`);
    }

    return this.prisma.cards.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async selectByField(id: string, field: string, value: string) {
    const card = await this.prisma.cards.findFirst({
      where: {
        id,
        [field]: value,
        deletedAt: null,
      },
    });

    if (!card) {
      throw new NotFoundException(
        `Card with id ${id} and ${field}=${value} not found`,
      );
    }

    return card;
  }

  async updateField(id: string, field: string, value: any) {
    const existing = await this.prisma.cards.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Card with id ${id} not found`);
    }

    return this.prisma.cards.update({
      where: { id },
      data: {
        [field]: value,
        updatedAt: new Date(),
      },
    });
  }

  async disable(id: string) {
    return this.updateField(id, 'status', 'disable');
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
