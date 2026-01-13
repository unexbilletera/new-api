import { Injectable } from '@nestjs/common';

export interface CursorPaginationInput {
  cursor?: string;
  take: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  previousCursor?: string;
  hasMore: boolean;
  hasPrevious: boolean;
}

@Injectable()
export class CursorPaginatorService {
  buildPrismaArgs(input: CursorPaginationInput) {
    const take = input.take;
    const skip = input.cursor ? 1 : 0;
    const sortOrder = input.sortOrder || 'desc';
    const sortBy = input.sortBy || 'createdAt';

    return {
      take: take + 1,
      skip,
      ...(input.cursor && { cursor: { id: input.cursor } }),
      orderBy: { [sortBy]: sortOrder },
    };
  }

  buildResult<T extends { id: string }>(
    data: T[],
    take: number,
  ): CursorPaginatedResult<T> {
    const hasMore = data.length > take;
    const items = hasMore ? data.slice(0, -1) : data;
    const hasPrevious = false;

    return {
      data: items,
      nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
      previousCursor: items[0]?.id,
      hasMore,
      hasPrevious,
    };
  }

  async paginate<T extends { id: string }>(
    query: () => Promise<T[]>,
    input: CursorPaginationInput,
  ): Promise<CursorPaginatedResult<T>> {
    const data = await query();
    return this.buildResult(data, input.take);
  }
}
