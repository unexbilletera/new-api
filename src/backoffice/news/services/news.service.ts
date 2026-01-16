import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listNews(status?: string) {
    const where: any = { deletedAt: null };

    if (status) {
      where.status = status;
    }

    return this.prisma.news.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createNews(data: any) {
    const now = new Date();
    return this.prisma.news.create({
      data: {
        ...data,
        id: data.id || this.generateUUID(),
        status: data.status || 'enable',
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async updateNews(id: string, data: any) {
    const existing = await this.prisma.news.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`News with id ${id} not found`);
    }

    return this.prisma.news.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deleteNews(id: string) {
    const existing = await this.prisma.news.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`News with id ${id} not found`);
    }

    return this.prisma.news.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async enableNews(id: string) {
    const existing = await this.prisma.news.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`News with id ${id} not found`);
    }

    const validTo = new Date();
    validTo.setMonth(validTo.getMonth() + 1);

    return this.prisma.news.update({
      where: { id },
      data: {
        status: 'enable',
        validTo,
        updatedAt: new Date(),
      },
    });
  }

  async disableNews(id: string) {
    const existing = await this.prisma.news.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`News with id ${id} not found`);
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return this.prisma.news.update({
      where: { id },
      data: {
        status: 'disable',
        validTo: yesterday,
        updatedAt: new Date(),
      },
    });
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
