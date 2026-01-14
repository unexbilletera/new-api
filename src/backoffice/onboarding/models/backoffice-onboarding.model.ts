import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class BackofficeOnboardingModel {
  constructor(private prisma: PrismaService) {}

  async list(where: any, skip: number, take: number) {
    return this.prisma.usersIdentities.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { users_usersIdentities_userIdTousers: true },
    });
  }

  async count(where: any) {
    return this.prisma.usersIdentities.count({ where });
  }

  async findById(id: string) {
    return this.prisma.usersIdentities.findFirst({
      where: { id },
      include: { users_usersIdentities_userIdTousers: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.usersIdentities.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async approve(id: string) {
    return this.prisma.usersIdentities.update({
      where: { id },
      data: { status: 'enable', updatedAt: new Date() },
    });
  }

  async reject(id: string, reason: string) {
    return this.prisma.usersIdentities.update({
      where: { id },
      data: {
        status: 'rejected',
        notes: reason || 'Rejeitado',
        updatedAt: new Date(),
      },
    });
  }
}
