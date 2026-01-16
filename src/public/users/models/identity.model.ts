import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class IdentityModel {
  constructor(private prisma: PrismaService) {}

  async findById(identityId: string) {
    const identity = await this.prisma.usersIdentities.findFirst({
      where: { id: identityId },
    });

    if (!identity) {
      throw new NotFoundException('users.errors.identityNotFound');
    }

    return identity;
  }

  async findByUserId(userId: string) {
    return this.prisma.usersIdentities.findMany({
      where: { userId },
      select: {
        id: true,
        country: true,
        taxDocumentNumber: true,
        taxDocumentType: true,
        identityDocumentNumber: true,
        identityDocumentType: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async findByUserIdFull(userId: string) {
    return this.prisma.usersIdentities.findMany({
      where: { userId },
    });
  }

  async updateAddress(identityId: string, addressJson: string) {
    return this.prisma.usersIdentities.update({
      where: { id: identityId },
      data: {
        address: addressJson,
        updatedAt: new Date(),
      },
    });
  }

  async update(identityId: string, data: any) {
    return this.prisma.usersIdentities.update({
      where: { id: identityId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }
}
