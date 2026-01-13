import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class LogModel {
  constructor(private prisma: PrismaService) {}

  // access_logs table does not exist - using users_access_log
  async list(where: any, skip: number, take: number) {
    return this.prisma.users_access_log.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(where: any) {
    return this.prisma.users_access_log.count({ where });
  }

  async findById(id: string) {
    return this.prisma.users_access_log.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.users_access_log.create({
      data: { ...data, createdAt: new Date() },
    });
  }
}
