import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ListLogsQueryDto, LogResponseDto, LogStatsDto } from '../dto/logs.dto';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}
  async list(query: ListLogsQueryDto): Promise<{
    data: LogResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.success !== undefined) {
      where.success =
        query.success === true || String(query.success) === 'true';
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.backofficeLogs.findMany({
        where,
        include: {
          backofficeUsers: {
            select: { id: true, name: true, email: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.backofficeLogs.count({ where }),
    ]);

    return {
      data: data.map(this.mapToResponse),
      total,
      page,
      limit,
    };
  }
  async get(id: string): Promise<LogResponseDto> {
    const log = await this.prisma.backofficeLogs.findFirst({
      where: { id },
      include: {
        backofficeUsers: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!log) {
      throw new NotFoundException('Log não encontrado');
    }

    return this.mapToResponse(log);
  }
  async stats(startDate?: string, endDate?: string): Promise<LogStatsDto> {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [
      totalLogs,
      successCount,
      failureCount,
      uniqueUsersResult,
      actionBreakdown,
    ] = await Promise.all([
      this.prisma.backofficeLogs.count({ where }),
      this.prisma.backofficeLogs.count({ where: { ...where, success: true } }),
      this.prisma.backofficeLogs.count({ where: { ...where, success: false } }),
      this.prisma.backofficeLogs.groupBy({
        by: ['userId'],
        where,
      }),
      this.prisma.backofficeLogs.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
      }),
    ]);

    return {
      totalLogs,
      successCount,
      failureCount,
      uniqueUsers: uniqueUsersResult.length,
      actionBreakdown: actionBreakdown.map((a) => ({
        action: a.action,
        count: a._count.action,
      })),
    };
  }
  async getActions(): Promise<string[]> {
    const actions = await this.prisma.backofficeLogs.groupBy({
      by: ['action'],
      orderBy: { action: 'asc' },
    });

    return actions.map((a) => a.action);
  }
  async getUserLogs(
    userId: string,
    query: ListLogsQueryDto,
  ): Promise<{
    data: LogResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.list({ ...query, userId });
  }

  private mapToResponse(log: any): LogResponseDto {
    return {
      id: log.id,
      userId: log.userId,
      userName: log.backofficeUsers?.name,
      userEmail: log.backofficeUsers?.email,
      action: log.action,
      success: log.success,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      details: log.details,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt,
    };
  }
}
