import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ReviewAlertDto } from '../dto/review-alert.dto';
import {
  ListProfilesQueryDto,
  ListIdentitiesQueryDto,
  ListAlertsQueryDto,
} from '../dto/list-query.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SpendingLimitsService {
  private readonly logger = new Logger(SpendingLimitsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * List all spending limit profiles
   */
  async listProfiles(query: ListProfilesQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.spending_limit_profiles.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.spending_limit_profiles.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get profile by ID
   */
  async getProfile(id: string) {
    const profile = await this.prisma.spending_limit_profiles.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Count users with this profile
    const userCount = await this.prisma.user_identity_spending_limits.count({
      where: {
        profileId: id,
        deletedAt: null,
      },
    });

    return {
      ...profile,
      userCount,
    };
  }

  /**
   * Create new spending limit profile
   */
  async createProfile(dto: CreateProfileDto) {
    // If setting as default, unset other defaults first
    if (dto.isDefault) {
      await this.prisma.spending_limit_profiles.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const profile = await this.prisma.spending_limit_profiles.create({
      data: {
        id: uuidv4(),
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault || false,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        dailyTransferLimit: dto.dailyTransferLimit || 0,
        dailyBoletoLimit: dto.dailyBoletoLimit || 0,
        nightlyTransferLimit: dto.nightlyTransferLimit,
        nightlyBoletoLimit: dto.nightlyBoletoLimit,
        nightlyStartHour: dto.nightlyStartHour,
        nightlyEndHour: dto.nightlyEndHour || 7,
        limitsAr: dto.limitsAr ? (dto.limitsAr as any) : undefined,
        limitsBr: dto.limitsBr ? (dto.limitsBr as any) : undefined,
      },
    });

    this.logger.log(`Created spending limit profile: ${profile.id}`);
    return profile;
  }

  /**
   * Update spending limit profile
   */
  async updateProfile(id: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.spending_limit_profiles.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Profile not found');
    }

    // If setting as default, unset other defaults first
    if (dto.isDefault && !existing.isDefault) {
      await this.prisma.spending_limit_profiles.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const profile = await this.prisma.spending_limit_profiles.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault,
        isActive: dto.isActive,
        dailyTransferLimit: dto.dailyTransferLimit,
        dailyBoletoLimit: dto.dailyBoletoLimit,
        nightlyTransferLimit: dto.nightlyTransferLimit,
        nightlyBoletoLimit: dto.nightlyBoletoLimit,
        nightlyStartHour: dto.nightlyStartHour,
        nightlyEndHour: dto.nightlyEndHour,
        limitsAr: dto.limitsAr ? (dto.limitsAr as any) : undefined,
        limitsBr: dto.limitsBr ? (dto.limitsBr as any) : undefined,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Updated spending limit profile: ${profile.id}`);
    return profile;
  }

  /**
   * Set profile as default
   */
  async setDefaultProfile(id: string) {
    const existing = await this.prisma.spending_limit_profiles.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Profile not found');
    }

    // Unset all other defaults
    await this.prisma.spending_limit_profiles.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    // Set this one as default
    const profile = await this.prisma.spending_limit_profiles.update({
      where: { id },
      data: {
        isDefault: true,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Set default spending limit profile: ${profile.id}`);
    return profile;
  }

  /**
   * Delete spending limit profile (soft delete)
   */
  async deleteProfile(id: string) {
    const existing = await this.prisma.spending_limit_profiles.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Profile not found');
    }

    // Check if profile is in use
    const usageCount = await this.prisma.user_identity_spending_limits.count({
      where: {
        profileId: id,
        deletedAt: null,
      },
    });

    if (usageCount > 0) {
      throw new BadRequestException(
        `Cannot delete profile. It is currently assigned to ${usageCount} user(s).`,
      );
    }

    if (existing.isDefault) {
      throw new BadRequestException('Cannot delete the default profile');
    }

    await this.prisma.spending_limit_profiles.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    this.logger.log(`Deleted spending limit profile: ${id}`);
    return { success: true, message: 'Profile deleted successfully' };
  }

  /**
   * List identities with spending limits
   */
  async listIdentities(query: ListIdentitiesQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (query.profileId) {
      where.profileId = query.profileId;
    }

    if (query.isCustom !== undefined) {
      where.isCustom = query.isCustom;
    }

    const [data, total] = await Promise.all([
      this.prisma.user_identity_spending_limits.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          usersIdentities: {
            select: {
              id: true,
              name: true,
              country: true,
              taxDocumentNumber: true,
              users_usersIdentities_userIdTousers: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user_identity_spending_limits.count({ where }),
    ]);

    return {
      data: data.map((item) => ({
        id: item.id,
        userIdentityId: item.userIdentityId,
        profileId: item.profileId,
        isCustom: item.isCustom,
        identity: item.usersIdentities
          ? {
              id: item.usersIdentities.id,
              name: item.usersIdentities.name,
              country: item.usersIdentities.country,
              taxDocument: item.usersIdentities.taxDocumentNumber,
              user: item.usersIdentities.users_usersIdentities_userIdTousers
                ? {
                    id: item.usersIdentities.users_usersIdentities_userIdTousers
                      .id,
                    name: item.usersIdentities
                      .users_usersIdentities_userIdTousers.name,
                    email:
                      item.usersIdentities.users_usersIdentities_userIdTousers
                        .email,
                  }
                : null,
            }
          : null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update user profile assignment
   */
  async updateUserProfile(userId: string, profileId: string) {
    // Find user's default identity
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { defaultUserIdentityId: true },
    });

    if (!user || !user.defaultUserIdentityId) {
      throw new NotFoundException('User or default identity not found');
    }

    return this.assignProfile(user.defaultUserIdentityId, profileId);
  }

  /**
   * Assign profile to identity
   */
  async assignProfile(userIdentityId: string, profileId: string) {
    // Verify profile exists
    const profile = await this.prisma.spending_limit_profiles.findFirst({
      where: { id: profileId, deletedAt: null, isActive: true },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found or inactive');
    }

    // Verify identity exists
    const identity = await this.prisma.usersIdentities.findUnique({
      where: { id: userIdentityId },
    });

    if (!identity) {
      throw new NotFoundException('Identity not found');
    }

    // Check if identity already has limits
    const existing = await this.prisma.user_identity_spending_limits.findFirst({
      where: { userIdentityId, deletedAt: null },
    });

    if (existing) {
      // Update existing
      const updated = await this.prisma.user_identity_spending_limits.update({
        where: { id: existing.id },
        data: {
          profileId,
          isCustom: false,
          updatedAt: new Date(),
        },
      });

      this.logger.log(
        `Updated profile assignment for identity ${userIdentityId} to profile ${profileId}`,
      );
      return updated;
    }

    // Create new
    const created = await this.prisma.user_identity_spending_limits.create({
      data: {
        id: uuidv4(),
        userIdentityId,
        profileId,
        isCustom: false,
      },
    });

    this.logger.log(
      `Created profile assignment for identity ${userIdentityId} to profile ${profileId}`,
    );
    return created;
  }

  /**
   * List spending limit alerts
   */
  async listAlerts(query: ListAlertsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.alertType) {
      where.alertType = query.alertType;
    }

    if (query.userIdentityId) {
      where.userIdentityId = query.userIdentityId;
    }

    const [data, total] = await Promise.all([
      this.prisma.spending_limit_alerts.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          usersIdentities: {
            select: {
              id: true,
              name: true,
              country: true,
              taxDocumentNumber: true,
              users_usersIdentities_userIdTousers: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.spending_limit_alerts.count({ where }),
    ]);

    return {
      data: data.map((alert) => ({
        id: alert.id,
        userIdentityId: alert.userIdentityId,
        transactionId: alert.transactionId,
        alertType: alert.alertType,
        attemptedAmount: alert.attemptedAmount,
        currentLimit: alert.currentLimit,
        currentSpent: alert.currentSpent,
        status: alert.status,
        reviewedBy: alert.reviewedBy,
        reviewedAt: alert.reviewedAt,
        notes: alert.notes,
        createdAt: alert.createdAt,
        identity: alert.usersIdentities
          ? {
              id: alert.usersIdentities.id,
              name: alert.usersIdentities.name,
              country: alert.usersIdentities.country,
              taxDocument: alert.usersIdentities.taxDocumentNumber,
              user: alert.usersIdentities.users_usersIdentities_userIdTousers
                ? {
                    id: alert.usersIdentities
                      .users_usersIdentities_userIdTousers.id,
                    name: alert.usersIdentities
                      .users_usersIdentities_userIdTousers.name,
                    email:
                      alert.usersIdentities.users_usersIdentities_userIdTousers
                        .email,
                  }
                : null,
            }
          : null,
        reviewer: alert.users
          ? {
              id: alert.users.id,
              name: alert.users.name,
              email: alert.users.email,
            }
          : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get pending alerts
   */
  async getPendingAlerts() {
    const alerts = await this.prisma.spending_limit_alerts.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        usersIdentities: {
          select: {
            id: true,
            name: true,
            country: true,
            taxDocumentNumber: true,
          },
        },
      },
    });

    return {
      data: alerts,
      total: alerts.length,
    };
  }

  /**
   * Review alert
   */
  async reviewAlert(alertId: string, dto: ReviewAlertDto, reviewerId: string) {
    const alert = await this.prisma.spending_limit_alerts.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    if (alert.status !== 'pending') {
      throw new BadRequestException('Alert has already been reviewed');
    }

    const updated = await this.prisma.spending_limit_alerts.update({
      where: { id: alertId },
      data: {
        status: dto.status,
        notes: dto.notes,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `Alert ${alertId} reviewed by ${reviewerId}: ${dto.status}`,
    );
    return updated;
  }
}
