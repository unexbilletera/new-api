import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class RoleModel {
  constructor(private prisma: PrismaService) {}

  async list(where: any, skip: number, take: number) {
    return this.prisma.backoffice_roles.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { permissions: true },
    });
  }

  async count(where: any) {
    return this.prisma.backoffice_roles.count({ where });
  }

  async findById(id: string) {
    return this.prisma.backoffice_roles.findUnique({
      where: { id },
      include: { permissions: true },
    });
  }

  async findByName(name: string) {
    return this.prisma.backoffice_roles.findFirst({
      where: { name },
    });
  }

  async create(data: any) {
    return this.prisma.backoffice_roles.create({
      data: { ...data, createdAt: new Date(), updatedAt: new Date() },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.backoffice_roles.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string) {
    return this.prisma.backoffice_roles.delete({
      where: { id },
    });
  }
}
