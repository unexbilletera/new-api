import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { randomUUID, randomBytes } from 'crypto';
const bcrypt = require('bcrypt');

import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PasswordHelper } from '../../../shared/helpers/password.helper';
import { NotificationService } from '../../../shared/notifications/notifications.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import {
  StartUserOnboardingDto,
  VerifyOnboardingCodeDto,
  UpdateUserOnboardingDto,
  StartIdentityOnboardingDto,
  UpdateIdentityOnboardingDto,
  UploadArgentinaDocumentDto,
} from '../dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private logger: LoggerService,
  ) {}

  private generateNumericCode(length = 6): string {
    return parseInt(randomBytes(length).toString('hex'), 16)
      .toString()
      .substring(0, length)
      .padStart(length, '0');
  }

  private addMinutes(minutes: number): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private normalizePhone(phone?: string): string | undefined {
    return phone ? phone.replace(/\D/g, '') : undefined;
  }

  private async isCodeValid(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
  }

  async startUserOnboarding(dto: StartUserOnboardingDto) {
    const email = this.normalizeEmail(dto.email);

    const existingUser = await this.prisma.users.findFirst({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const onboardingState = {
      completedSteps: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7'],
      needsCorrection: [],
    };

    const user = await this.prisma.users.create({
      data: {
        id: randomUUID(),
        email,
        username: email.split('@')[0],
        status: 'pending',
        access: 'user',
        onboardingState,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      message: 'Onboarding started',
      userId: user.id,
      onboardingState,
    };
  }

  async verifyOnboardingCode(dto: VerifyOnboardingCodeDto) {
    const email = this.normalizeEmail(dto.email);
    const phone = this.normalizePhone(dto.phone);

    if (dto.type === 'phone' && !phone) {
      throw new BadRequestException('Phone is required for phone verification');
    }

    let user = await this.prisma.users.findFirst({
      where: dto.type === 'email' ? { email } : { phone },
    });

    if (!user) {
      user = await this.prisma.users.create({
        data: {
          id: randomUUID(),
          email,
          phone: phone || null,
          username: email ? email.split('@')[0] : undefined,
          status: 'pending',
          access: 'user',
          onboardingState: { completedSteps: [], needsCorrection: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    const onboardingState = user.onboardingState || { completedSteps: [], needsCorrection: [] };

    if (dto.type === 'email') {
      const record = await this.prisma.email_validation_codes.findFirst({
        where: { email, expiresAt: { gt: new Date() } },
      });

      if (!record) {
        throw new BadRequestException('Code not found or expired');
      }

      const valid = await this.isCodeValid(dto.code, record.code);
      if (!valid) {
        throw new BadRequestException('Invalid code');
      }

      if (!onboardingState.completedSteps.includes('1.2')) onboardingState.completedSteps.push('1.2');
      if (!onboardingState.completedSteps.includes('1.3')) onboardingState.completedSteps.push('1.3');

      await this.prisma.email_validation_codes.update({
        where: { email },
        data: { verified: true, verifiedAt: new Date(), expiresAt: this.addMinutes(10) },
      });
    } else {
      const record = await this.prisma.phone_validation_codes.findFirst({
        where: { phone: phone!, expiresAt: { gt: new Date() } },
      });

      if (!record) {
        throw new BadRequestException('Code not found or expired');
      }

      const valid = await this.isCodeValid(dto.code, record.code);
      if (!valid) {
        throw new BadRequestException('Invalid code');
      }

      if (!onboardingState.completedSteps.includes('1.5')) onboardingState.completedSteps.push('1.5');
      if (!onboardingState.completedSteps.includes('1.6')) onboardingState.completedSteps.push('1.6');

      await this.prisma.phone_validation_codes.update({
        where: { phone: phone! },
        data: { verified: true, verifiedAt: new Date(), expiresAt: this.addMinutes(10) },
      });
    }

    const updated = await this.prisma.users.update({
      where: { id: user.id },
      data: {
        onboardingState,
        emailVerifiedAt: dto.type === 'email' ? new Date() : user.emailVerifiedAt,
        phoneVerifiedAt: dto.type === 'phone' ? new Date() : user.phoneVerifiedAt,
        updatedAt: new Date(),
      },
    });

    return {
      message: 'Code verified successfully',
      userId: updated.id,
      onboardingState: updated.onboardingState,
    };
  }

  async updateUserOnboarding(userId: string, dto: UpdateUserOnboardingDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentState = (user.onboardingState as any) || { completedSteps: [], needsCorrection: [] };
    const dataToUpdate: any = { updatedAt: new Date() };
    let completedStep = '';

    if (dto.phone) {
      dataToUpdate.phone = this.normalizePhone(dto.phone);
      completedStep = '1.4';
    }

    if (dto.password) {
      dataToUpdate.password = await PasswordHelper.hash(dto.password);
      dataToUpdate.status = 'pending';
      dataToUpdate.passwordUpdatedAt = new Date();
      completedStep = '1.7';

      if (dto.campaignCode) {
        const now = new Date();
        const campaignCodeUpper = dto.campaignCode.toUpperCase().trim();
        const campaign = await this.prisma.campaign_codes.findFirst({
          where: {
            code: campaignCodeUpper,
            isActive: true,
            deletedAt: null,
          },
        });

        if (campaign) {
          const validFromOk = !campaign.validFrom || campaign.validFrom <= now;
          const validToOk = !campaign.validTo || campaign.validTo >= now;
          if (validFromOk && validToOk) {
            const existingUserCode = await this.prisma.user_campaign_codes.findUnique({
              where: { userId },
            });
            if (!existingUserCode) {
              await this.prisma.user_campaign_codes.create({
                data: {
                  id: randomUUID(),
                  userId,
                  campaignCodeId: campaign.id,
                  code: campaign.code,
                  createdAt: new Date(),
                },
              });
            }
          }
        }
      }
    }

    if (dto.firstName || dto.lastName) {
      dataToUpdate.firstName = dto.firstName ?? user.firstName;
      dataToUpdate.lastName = dto.lastName ?? user.lastName;
      if (dto.firstName && dto.lastName) {
        dataToUpdate.name = `${dto.firstName} ${dto.lastName}`;
      } else if (dto.firstName) {
        dataToUpdate.name = dto.firstName;
      } else if (dto.lastName) {
        dataToUpdate.name = dto.lastName;
      }
      dataToUpdate.username = dto.firstName || user.username;
      completedStep = '1.8';
    }

    if (dto.country || dto.birthdate || dto.gender || dto.maritalStatus) {
      dataToUpdate.country = dto.country ?? user.country;
      dataToUpdate.birthdate = dto.birthdate ? new Date(dto.birthdate) : user.birthdate;
      dataToUpdate.gender = dto.gender ?? user.gender;
      dataToUpdate.maritalStatus = dto.maritalStatus ?? user.maritalStatus;
      completedStep = '1.9';
    }

    if (dto.pep || dto.pepSince) {
      dataToUpdate.pep = dto.pep ?? user.pep;
      dataToUpdate.pepSince = dto.pepSince ? new Date(dto.pepSince) : user.pepSince;
      completedStep = '1.10';
    }

    if (dto.livenessImage) {
      dataToUpdate.livenessImage = dto.livenessImage;
      dataToUpdate.livenessVerifiedAt = new Date();
      completedStep = '1.11';
      if (!currentState.completedSteps.includes('1.11')) currentState.completedSteps.push('1.11');
      if (!currentState.completedSteps.includes('1.12')) currentState.completedSteps.push('1.12');

      if (user.email) {
        await this.notificationService.sendEmail({
          to: user.email,
          subject: 'Selfie recebida',
          text: 'Recebemos sua selfie para verificação de prova de vida.',
        });
      }
    }

    if (completedStep && !currentState.completedSteps.includes(completedStep)) {
      currentState.completedSteps.push(completedStep);
    }

    dataToUpdate.onboardingState = currentState;

    const updated = await this.prisma.users.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        onboardingState: true,
      },
    });

    return { user: updated };
  }

  async startIdentityOnboarding(userId: string, dto: StartIdentityOnboardingDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const country = (dto.country || dto.countryCode || 'br').toLowerCase();

    const existingIdentity = await this.prisma.usersIdentities.findFirst({
      where: { userId, country, deletedAt: null },
    });

    if (existingIdentity) {
      return {
        message: 'Identity already exists',
        identityId: existingIdentity.id,
      };
    }

    const identity = await this.prisma.usersIdentities.create({
      data: {
        id: randomUUID(),
        userId,
        country,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    try {
      const defaultProfile = await this.prisma.spending_limit_profiles.findFirst({
        where: { isDefault: true, isActive: true, deletedAt: null },
        select: { id: true },
      });

      if (defaultProfile?.id) {
        await this.prisma.user_identity_spending_limits.create({
          data: {
            id: randomUUID(),
            userIdentityId: identity.id,
            profileId: defaultProfile.id,
            isCustom: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      this.logger.warn('[onboarding] skipping spending limit creation', { error: error?.message || error });
    }

    return {
      message: 'Identity onboarding started',
      identityId: identity.id,
    };
  }

  async updateIdentityOnboarding(identityId: string, dto: UpdateIdentityOnboardingDto) {
    const identity = await this.prisma.usersIdentities.findUnique({
      where: { id: identityId },
      include: { users_usersIdentities_userIdTousers: true },
    });

    if (!identity) {
      throw new NotFoundException('Identity not found');
    }

    const updates: any = { updatedAt: new Date() };
    const onboardingState = identity.users_usersIdentities_userIdTousers?.onboardingState || { completedSteps: [], needsCorrection: [] };

    if (dto.documentNumber) {
      updates.identityDocumentNumber = dto.documentNumber;
      updates.taxDocumentNumber = dto.documentNumber;
    }
    if (dto.documentIssuer) {
      updates.identityDocumentIssuer = dto.documentIssuer;
    }
    if (dto.documentExpiration) {
      updates.identityDocumentIssueDate = new Date(dto.documentExpiration);
    }
    if (dto.biometricData) {
      updates.notes = JSON.stringify(dto.biometricData);
    }

    if (!onboardingState.completedSteps.includes('2.2')) onboardingState.completedSteps.push('2.2');

    await this.prisma.usersIdentities.update({ where: { id: identityId }, data: updates });
    await this.prisma.users.update({
      where: { id: identity.userId },
      data: { onboardingState, updatedAt: new Date() },
    });

    return {
      message: 'Identity updated successfully',
      identityId,
    };
  }

  async uploadArgentinaDocument(userId: string, identityId: string, dto: UploadArgentinaDocumentDto) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    const identity = await this.prisma.usersIdentities.findUnique({ where: { id: identityId } });

    if (!user || !identity) {
      throw new NotFoundException('User or identity not found');
    }

    const onboardingState = user.onboardingState || { completedSteps: [], needsCorrection: [] };

    await this.prisma.usersIdentities.update({
      where: { id: identityId },
      data: {
        identityDocumentFrontImage: dto.frontImage,
        identityDocumentBackImage: dto.backImage,
        identityDocumentType: 'dni',
        identityDocumentNumber: dto.pdf417Data?.documentNumber,
        identityDocumentIssueDate: dto.pdf417Data?.dateOfBirth
          ? new Date(dto.pdf417Data.dateOfBirth)
          : identity.identityDocumentIssueDate,
        updatedAt: new Date(),
      },
    });

    const userUpdates: any = { updatedAt: new Date() };
    if (dto.pdf417Data?.firstName) userUpdates.firstName = dto.pdf417Data.firstName;
    if (dto.pdf417Data?.lastName) userUpdates.lastName = dto.pdf417Data.lastName;
    if (dto.pdf417Data?.dateOfBirth) userUpdates.birthdate = new Date(dto.pdf417Data.dateOfBirth);
    if (dto.pdf417Data?.gender)
      userUpdates.gender = dto.pdf417Data.gender.toLowerCase() === 'm' ? 'male' : 'female';

    if (!onboardingState.completedSteps.includes('2.2')) onboardingState.completedSteps.push('2.2');
    if (!onboardingState.completedSteps.includes('documentVerificationSuccess.ar'))
      onboardingState.completedSteps.push('documentVerificationSuccess.ar');

    userUpdates.onboardingState = onboardingState;

    await this.prisma.users.update({ where: { id: userId }, data: userUpdates });

    if (user.email) {
      await this.notificationService.sendEmail({
        to: user.email,
        subject: 'Documento recebido',
        text: 'Recebemos seu documento argentino para validação.',
      });
    }

    return {
      message: 'Document uploaded successfully',
      onboardingState,
    };
  }

  async getOnboardingPendingData(userIdentityId: string) {
    const identity = await this.prisma.usersIdentities.findUnique({
      where: { id: userIdentityId },
      include: { users_usersIdentities_userIdTousers: true },
    });

    if (!identity) {
      throw new NotFoundException('Identity not found');
    }

    const state = identity.users_usersIdentities_userIdTousers?.onboardingState || { completedSteps: [], needsCorrection: [] };
    const requiredSteps = identity.country === 'ar'
      ? ['2.1', '2.2', '2.3', '2.4']
      : ['3.1', '3.2', '3.3', '3.4', '3.5'];

    const pendingSteps = requiredSteps.filter((step) => !state.completedSteps?.includes(step));
    return { pendingFields: pendingSteps, needsCorrection: state.needsCorrection || [] };
  }

  async updateOnboardingSpecificData(userIdentityId: string, fieldUpdates: any) {
    await this.prisma.usersIdentities.update({
      where: { id: userIdentityId },
      data: {
        ...fieldUpdates,
        updatedAt: new Date(),
      },
    });

    return { message: 'Onboarding data updated' };
  }

  async getOnboardingStatus(userIdentityId: string) {
    const identity = await this.prisma.usersIdentities.findUnique({
      where: { id: userIdentityId },
      include: { users_usersIdentities_userIdTousers: true },
    });

    if (!identity) {
      throw new NotFoundException('Identity not found');
    }

    const state = identity.users_usersIdentities_userIdTousers?.onboardingState || { completedSteps: [] };
    const requiredSteps = identity.country === 'ar'
      ? ['2.1', '2.2', '2.3', '2.4']
      : ['3.1', '3.2', '3.3', '3.4', '3.5'];
    const done = state.completedSteps || [];
    const pendingSteps = requiredSteps.filter((s) => !done.includes(s));
    const completionPercentage = Math.round(((requiredSteps.length - pendingSteps.length) / requiredSteps.length) * 100);

    return {
      status: pendingSteps.length === 0 ? 'completed' : 'pending',
      completionPercentage,
      pendingSteps,
    };
  }

  async validateOnboardingData(userIdentityId: string) {
    const identity = await this.prisma.usersIdentities.findUnique({
      where: { id: userIdentityId },
      include: { users_usersIdentities_userIdTousers: true },
    });

    if (!identity) {
      throw new NotFoundException('Identity not found');
    }

    const errors = [] as string[];
    if (!identity.identityDocumentNumber) errors.push('identityDocumentNumber');
    if (!identity.identityDocumentFrontImage) errors.push('identityDocumentFrontImage');
    if (!identity.identityDocumentBackImage) errors.push('identityDocumentBackImage');

    return { isValid: errors.length === 0, errors };
  }

  async retryOnboarding(userIdentityId: string) {
    const identity = await this.prisma.usersIdentities.findUnique({ where: { id: userIdentityId } });
    if (!identity) {
      throw new NotFoundException('Identity not found');
    }

    await this.prisma.usersIdentities.update({
      where: { id: userIdentityId },
      data: { status: 'pending', updatedAt: new Date() },
    });

    return { message: 'Onboarding data resubmitted' };
  }
}
