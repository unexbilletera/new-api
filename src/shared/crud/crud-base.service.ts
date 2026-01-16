import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SearchOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  searchFields?: string[];
  filters?: Record<string, any>;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class CrudBaseService<T = any> {
  constructor(protected readonly prisma: PrismaService) {}

  protected getModel(modelName: string): any {
    return (this.prisma as any)[modelName];
  }

  async search(
    modelName: string,
    options: SearchOptions = {},
  ): Promise<SearchResult<T>> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      searchFields = ['name'],
      filters = {},
    } = options;

    const model = this.getModel(modelName);
    const skip = (page - 1) * pageSize;

    const where: any = {
      deletedAt: null,
      ...filters,
    };

    if (search && searchFields.length > 0) {
      where.OR = searchFields.map((field) => ({
        [field]: { contains: search },
      }));
    }

    const [data, total] = await Promise.all([
      model.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      model.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async select(modelName: string, id: string): Promise<T> {
    const model = this.getModel(modelName);
    const record = await model.findFirst({
      where: { id, deletedAt: null },
    });

    if (!record) {
      throw new NotFoundException(`Record with id ${id} not found`);
    }

    return record;
  }

  async create(modelName: string, data: any): Promise<T> {
    const model = this.getModel(modelName);
    const now = new Date();

    return model.create({
      data: {
        ...data,
        id: data.id || this.generateUUID(),
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async update(modelName: string, id: string, data: any): Promise<T> {
    const model = this.getModel(modelName);

    const existing = await model.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Record with id ${id} not found`);
    }

    return model.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async delete(modelName: string, id: string): Promise<T> {
    const model = this.getModel(modelName);

    const existing = await model.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Record with id ${id} not found`);
    }

    return model.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async selectByField(
    modelName: string,
    id: string,
    field: string,
    value: string,
  ): Promise<T> {
    const model = this.getModel(modelName);
    const record = await model.findFirst({
      where: {
        id,
        [field]: value,
        deletedAt: null,
      },
    });

    if (!record) {
      throw new NotFoundException(
        `Record with id ${id} and ${field}=${value} not found`,
      );
    }

    return record;
  }

  async updateField(
    modelName: string,
    id: string,
    field: string,
    value: any,
  ): Promise<T> {
    const model = this.getModel(modelName);

    const existing = await model.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Record with id ${id} not found`);
    }

    return model.update({
      where: { id },
      data: {
        [field]: value,
        updatedAt: new Date(),
      },
    });
  }

  async disable(modelName: string, id: string): Promise<T> {
    return this.updateField(modelName, id, 'status', 'disable');
  }

  protected generateUUID(): string {
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
