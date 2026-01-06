import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class ActionModel {
  constructor(private prisma: PrismaService) {}

  async list(where: any, skip: number, take: number) {
    return this.prisma.actions.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(where: any) {
    return this.prisma.actions.count({ where });
  }

  async findById(id: string) {
    return this.prisma.actions.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.actions.create({
      data: { ...data, createdAt: new Date(), updatedAt: new Date() },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.actions.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string) {
    return this.prisma.actions.delete({
      where: { id },
    });
  }
}
