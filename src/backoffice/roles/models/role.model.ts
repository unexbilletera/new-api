import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class RoleModel {
  constructor(private prisma: PrismaService) {}

  async list(where: any, skip: number, take: number) {
    return this.prisma.backofficeRoles.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(where: any) {
    return this.prisma.backofficeRoles.count({ where });
  }

  async findById(id: string) {
    return this.prisma.backofficeRoles.findUnique({
      where: { id },
    });
  }

  async findByName(name: string) {
    return this.prisma.backofficeRoles.findFirst({
      where: { name },
    });
  }

  async create(data: any) {
    return this.prisma.backofficeRoles.create({
      data: { ...data, createdAt: new Date(), updatedAt: new Date() },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.backofficeRoles.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string) {
    return this.prisma.backofficeRoles.delete({
      where: { id },
    });
  }
}
