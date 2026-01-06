import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class BackofficeUserModel {
  constructor(private prisma: PrismaService) {}

  async list(where: any, skip: number, take: number) {
    return this.prisma.backoffice_users.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(where: any) {
    return this.prisma.backoffice_users.count({ where });
  }

  async findById(id: string) {
    return this.prisma.backoffice_users.findUnique({
      where: { id },
      include: { roles: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.backoffice_users.findFirst({
      where: { email },
    });
  }

  async create(data: any) {
    return this.prisma.backoffice_users.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.backoffice_users.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    return this.prisma.backoffice_users.delete({
      where: { id },
    });
  }
}
