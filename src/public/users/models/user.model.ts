import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

interface UserWithRelations {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  status: string;
  access: string;
  language: string | null;
  country: string | null;
  birthdate: Date | null;
  gender: string | null;
  maritalStatus: string | null;
  pep: boolean;
  pepSince: Date | null;
  fatherName: string | null;
  motherName: string | null;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  livenessVerifiedAt: Date | null;
  onboardingState: any;
  notes: string | null;
  verifyToken: string | null;
  image: string | null;
  livenessImage: string | null;
  validaId: string | null;
  password: string | null;
  passwordUpdatedAt: Date | null;
  accessToken: string | null;
  unlockToken: string | null;
  recovery: any;
  number: string | null;
  defaultUserIdentityId: string | null;
  defaultUserAccountId: string | null;
  createdAt: Date;
  updatedAt: Date;
  usersIdentities: Array<{
    id: string;
    country: string | null;
    status: string | null;
    type: string | null;
    subtype: string | null;
    name: string | null;
    taxDocumentType: string | null;
    taxDocumentNumber: string | null;
    identityDocumentType: string | null;
    identityDocumentNumber: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  usersAccounts: Array<{
    id: string;
    number: string | null;
    type: string | null;
    status: string | null;
    cvu: string | null;
    alias: string | null;
    balance: string | null;
    createdAt: Date;
  }>;
}

@Injectable()
export class UserModel {
  constructor(private prisma: PrismaService) {}

  async findById(userId: string): Promise<UserWithRelations> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        usersIdentities_usersIdentities_userIdTousers: {
          select: {
            id: true,
            country: true,
            status: true,
            type: true,
            subtype: true,
            name: true,
            taxDocumentType: true,
            taxDocumentNumber: true,
            identityDocumentType: true,
            identityDocumentNumber: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        usersAccounts: {
          select: {
            id: true,
            number: true,
            type: true,
            status: true,
            cvu: true,
            alias: true,
            balance: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    return {
      ...user,
      usersIdentities: user.usersIdentities_usersIdentities_userIdTousers,
    } as unknown as UserWithRelations;
  }

  async findByIdSimple(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.users.findFirst({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findByEmailExcluding(email: string, excludeUserId: string) {
    return this.prisma.users.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        id: { not: excludeUserId },
      },
      select: { id: true },
    });
  }

  async exists(userId: string): Promise<boolean> {
    const count = await this.prisma.users.count({
      where: { id: userId },
    });
    return count > 0;
  }

  async findByIdWithValidStatus(userId: string) {
    const user = await this.prisma.users.findFirst({
      where: {
        id: userId,
        status: { in: ['pending', 'enable', 'error'] },
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

  async findByIdWithIdentities(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        usersIdentities_usersIdentities_userIdTousers: {
          select: { id: true, createdAt: true, status: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    return user;
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.users.update({
      where: { id: userId },
      data,
    });
  }

  async updateEmailChangeRequest(
    userId: string,
    verifyToken: string,
    notes: string,
  ) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        verifyToken,
        notes,
        updatedAt: new Date(),
      },
    });
  }

  async confirmEmailChange(userId: string, newEmail: string, notes: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        email: newEmail,
        emailVerifiedAt: new Date(),
        verifyToken: null,
        notes,
        updatedAt: new Date(),
      },
    });
  }

  async updateIdentityAddress(identityId: string, addressJson: string) {
    return this.prisma.usersIdentities.update({
      where: { id: identityId },
      data: {
        address: addressJson,
        updatedAt: new Date(),
      },
    });
  }

  async changePassword(userId: string, hashedPassword: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordUpdatedAt: new Date(),
        recovery: null,
        accessToken: null,
        unlockToken: null,
        updatedAt: new Date(),
      },
    });
  }

  async clearTokens(userId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        accessToken: null,
        unlockToken: null,
      },
    });
  }

  async closeAccount(userId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        accessToken: null,
        unlockToken: null,
        status: 'disable',
      },
    });
  }

  async updateLivenessSimple(userId: string, livenessImage: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        livenessImage,
        livenessVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async updateWithValidaEnrollment(
    userId: string,
    validaId: string,
    notes: string,
  ) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        validaId,
        notes,
      },
    });
  }

  async updateWithValidaVerification(
    userId: string,
    livenessImage: string | null,
    notes: string,
    onboardingState: any,
  ) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        access: 'customer',
        livenessVerifiedAt: new Date(),
        livenessImage,
        notes,
        onboardingState,
      },
    });
  }

  async updateValidaStatus(
    userId: string,
    status: 'pending' | 'process' | 'enable' | 'disable' | 'error' | 'rejected',
    notes: string,
  ) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        status: status as any,
        notes,
      },
    });
  }

  async updateValidaNotes(userId: string, notes: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { notes },
    });
  }

  async updateValidaId(userId: string, validaId: string, notes: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        validaId,
        notes,
      },
    });
  }

  async setDefaultIdentity(userId: string, identityId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { defaultUserIdentityId: identityId },
    });
  }

  async setDefaultAccount(userId: string, accountId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { defaultUserAccountId: accountId },
    });
  }

  async getUserIdentities(userId: string) {
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

  async getUserAccounts(userId: string) {
    return this.prisma.usersAccounts.findMany({
      where: {
        usersIdentities: { userId },
      },
      select: {
        id: true,
        type: true,
        balance: true,
        alias: true,
        status: true,
      },
    });
  }

  async getAccountById(accountId: string) {
    const account = await this.prisma.usersAccounts.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('users.errors.accountNotFound');
    }

    return account;
  }

  async updateAccountAlias(accountId: string, alias: string) {
    return this.prisma.usersAccounts.update({
      where: { id: accountId },
      data: { alias },
    });
  }

  async findByIdWithAll(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        usersIdentities_usersIdentities_userIdTousers: true,
        usersAccounts: true,
      },
    });

    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    return user;
  }
}
