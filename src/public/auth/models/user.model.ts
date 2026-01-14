import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class AuthUserModel {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.users.findFirst({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.users.findFirst({
      where: { username: username.toLowerCase() },
    });
  }

  async findByIdWithValidStatus(userId: string) {
    const user = await this.prisma.users.findFirst({
      where: {
        id: userId,
        status: { in: ['pending', 'enable', 'error', 'disable'] },
        access: {
          in: ['administrator', 'supervisor', 'operator', 'customer', 'user'],
        },
      },
    });

    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    return user;
  }

  async create(data: any) {
    return this.prisma.users.create({ data });
  }

  async exists(email: string, phone: string) {
    return this.prisma.users.findFirst({
      where: {
        OR: [{ email: email.toLowerCase().trim() }, { phone }],
      },
    });
  }

  async updateLastLogin(userId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async updateEmailVerified(email: string) {
    return this.prisma.users.update({
      where: { email: email.toLowerCase().trim() },
      data: { emailVerifiedAt: new Date(), updatedAt: new Date() },
    });
  }

  async updatePhoneVerified(phone: string) {
    const user = await this.prisma.users.findFirst({
      where: { phone },
    });
    if (!user) {
      throw new Error('User not found');
    }
    return this.prisma.users.update({
      where: { id: user.id },
      data: { phoneVerifiedAt: new Date(), updatedAt: new Date() },
    });
  }

  async storeRecoveryCode(email: string, hashedCode: string) {
    return this.prisma.users.update({
      where: { email: email.toLowerCase().trim() },
      data: { recovery: hashedCode, updatedAt: new Date() },
    });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordUpdatedAt: new Date(),
        recovery: null,
        updatedAt: new Date(),
      },
    });
  }

  async unlockAccount(userId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        status: 'enable',
        unlockToken: null,
        updatedAt: new Date(),
      },
    });
  }

  async findByIdSelect(userId: string) {
    return this.prisma.users.findFirst({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        access: true,
      },
    });
  }

  async findWithRelations(userId: string) {
    return this.prisma.users.findFirst({
      where: { id: userId },
    });
  }

  async getUserIdentities(userId: string) {
    return this.prisma.usersIdentities.findMany({
      where: { userId },
    });
  }

  async getUserAccounts(userId: string) {
    return this.prisma.usersAccounts.findMany({
      where: { userId },
    });
  }

  async hasActiveDevice(userId: string, deviceIdentifier?: string) {
    if (deviceIdentifier) {
      return this.prisma.devices.findFirst({
        where: { userId, deviceIdentifier, status: 'active' },
      });
    }
    return this.prisma.devices.findFirst({
      where: { userId, status: 'active' },
    });
  }
}
