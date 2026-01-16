import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@Injectable()
export class AccreditationsService {
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
        { number: { contains: search } },
        { name: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.accreditations.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          users: { select: { id: true, name: true, email: true } },
          transactions: { select: { id: true, type: true, status: true } },
        },
      }),
      this.prisma.accreditations.count({ where }),
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
    const accreditation = await this.prisma.accreditations.findFirst({
      where: { id, deletedAt: null },
      include: {
        users: { select: { id: true, name: true, email: true } },
        transactions: { select: { id: true, type: true, status: true } },
      },
    });

    if (!accreditation) {
      throw new NotFoundException(`Accreditation with id ${id} not found`);
    }

    return accreditation;
  }
}
