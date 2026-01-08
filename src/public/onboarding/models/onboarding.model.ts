import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class OnboardingModel {
  constructor(private prisma: PrismaService) {}

  async findUserById(userId: string) {
    return this.prisma.users.findUnique({
      where: { id: userId },
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.users.findFirst({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findUserByPhone(phone: string) {
    return this.prisma.users.findFirst({
      where: { phone },
    });
  }

  async createUser(data: {
    email: string;
    username: string;
    status: 'pending' | 'process' | 'enable' | 'disable' | 'error' | 'rejected';
    access: 'administrator' | 'supervisor' | 'operator' | 'customer' | 'user';
    onboardingState: any;
  }) {
    return this.prisma.users.create({
      data: {
        id: randomUUID(),
        email: data.email,
        username: data.username,
        status: data.status,
        access: data.access,
        onboardingState: data.onboardingState,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async updateUserOnboarding(userId: string, data: any) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        onboardingState: true,
      },
    });
  }

  async updateUserOnboardingComplete(userId: string, data: any) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async findIdentityById(identityId: string) {
    return this.prisma.usersIdentities.findUnique({
      where: { id: identityId },
      include: { users_usersIdentities_userIdTousers: true },
    });
  }

  async findIdentityByUserAndCountry(userId: string, country: 'ar' | 'br') {
    return this.prisma.usersIdentities.findFirst({
      where: { userId, country, deletedAt: null },
    });
  }

  async createIdentity(data: {
    userId: string;
    country: 'ar' | 'br';
    status: 'pending' | 'process' | 'enable' | 'disable' | 'error' | 'rejected';
  }) {
    return this.prisma.usersIdentities.create({
      data: {
        id: randomUUID(),
        userId: data.userId,
        country: data.country,
        status: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async updateIdentity(identityId: string, data: any) {
    return this.prisma.usersIdentities.update({
      where: { id: identityId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async findDefaultSpendingLimitProfile() {
    return this.prisma.spending_limit_profiles.findFirst({
      where: { isDefault: true, isActive: true, deletedAt: null },
      select: { id: true },
    });
  }

  async createUserIdentitySpendingLimit(data: {
    userIdentityId: string;
    profileId: string;
  }) {
    return this.prisma.user_identity_spending_limits.create({
      data: {
        id: randomUUID(),
        ...data,
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findCampaignCode(code: string) {
    return this.prisma.campaign_codes.findFirst({
      where: {
        code: code.toUpperCase().trim(),
        isActive: true,
        deletedAt: null,
      },
    });
  }

  async findUserCampaignCode(userId: string) {
    return this.prisma.user_campaign_codes.findUnique({
      where: { userId },
    });
  }

  async createUserCampaignCode(userId: string, campaignCodeId: string, code: string) {
    return this.prisma.user_campaign_codes.create({
      data: {
        id: randomUUID(),
        userId,
        campaignCodeId,
        code,
        createdAt: new Date(),
      },
    });
  }

  async getOnboardingPendingData(identityId: string) {
    const identity = await this.findIdentityById(identityId);
    if (!identity) {
      throw new NotFoundException('Identity not found');
    }
    return identity;
  }

  async getOnboardingStatus(identityId: string) {
    const identity = await this.findIdentityById(identityId);
    if (!identity) {
      throw new NotFoundException('Identity not found');
    }
    return identity;
  }

  async validateOnboardingData(identityId: string) {
    const identity = await this.findIdentityById(identityId);
    if (!identity) {
      throw new NotFoundException('Identity not found');
    }
    return identity;
  }

  async retryOnboarding(identityId: string) {
    return this.prisma.usersIdentities.update({
      where: { id: identityId },
      data: { status: 'pending', updatedAt: new Date() },
    });
  }
}
