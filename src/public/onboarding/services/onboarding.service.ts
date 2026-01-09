import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { randomUUID, randomBytes } from 'crypto';
const bcrypt = require('bcrypt');

import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PasswordHelper } from '../../../shared/helpers/password.helper';
import { NotificationService } from '../../../shared/notifications/notifications.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EmailService } from '../../../shared/email/email.service';
import { SmsService } from '../../../shared/sms/sms.service';
import { AppConfigService } from '../../../shared/config/config.service';
import { ValidaService } from '../../../shared/valida/valida.service';
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
    private emailService: EmailService,
    private smsService: SmsService,
    private appConfigService: AppConfigService,
    private validaService: ValidaService,
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
    this.logger.info('[ONBOARDING] Starting user onboarding', { email: dto.email });

    const email = this.normalizeEmail(dto.email);

    const emailRegex = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email)) {
      this.logger.warn('[ONBOARDING] Invalid email format', { email });
      throw new BadRequestException('users.errors.invalidEmail');
    }

    const existingUser = await this.prisma.users.findFirst({ where: { email } });
    if (existingUser) {
      this.logger.warn('[ONBOARDING] Email already in use', { email, existingUserId: existingUser.id });
      throw new ConflictException('users.errors.emailAlreadyInUse');
    }

    const onboardingState = {
      completedSteps: ['1.1'],
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

    this.logger.info('[ONBOARDING] User onboarding started successfully', {
      userId: user.id,
      email: user.email,
      completedSteps: onboardingState.completedSteps,
    });

    return {
      success: true,
      message: 'Onboarding started successfully',
      userId: user.id,
      onboardingState,
      nextStep: 'emailForm',
    };
  }

  async verifyOnboardingCode(dto: VerifyOnboardingCodeDto) {
    this.logger.info('[ONBOARDING] Verifying code', {
      type: dto.type,
      email: dto.email ? this.normalizeEmail(dto.email) : undefined,
      phone: dto.phone ? this.normalizePhone(dto.phone) : undefined,
    });

    if (!dto.code || !dto.type) {
      throw new BadRequestException('users.errors.codeAndTypeRequired');
    }

    const email = dto.email ? this.normalizeEmail(dto.email) : undefined;
    const phone = dto.phone ? this.normalizePhone(dto.phone) : undefined;

    if (dto.type === 'email' && !email) {
      throw new BadRequestException('users.errors.emailRequired');
    }

    if (dto.type === 'phone' && !phone) {
      throw new BadRequestException('users.errors.phoneRequired');
    }

    let user = await this.prisma.users.findFirst({
      where: dto.type === 'email' ? { email } : { phone },
    });

    if (!user) {
      this.logger.warn('[ONBOARDING] User not found for code verification', {
        type: dto.type,
        email,
        phone,
      });
      throw new NotFoundException('users.errors.userNotFound');
    }

    const onboardingState = (user.onboardingState as any) || { completedSteps: [], needsCorrection: [] };

    if (dto.type === 'email') {
      try {
        this.logger.info('[ONBOARDING] Verifying email code', { userId: user.id, email });
        await this.emailService.verifyCode(email!, dto.code, true);

        if (!onboardingState.completedSteps.includes('1.2')) {
          onboardingState.completedSteps.push('1.2');
        }
        if (!onboardingState.completedSteps.includes('1.3')) {
          onboardingState.completedSteps.push('1.3');
        }

        this.logger.info('[ONBOARDING] Email code verified successfully', {
          userId: user.id,
          completedSteps: onboardingState.completedSteps,
        });
      } catch (error) {
        this.logger.error(
          '[ONBOARDING] Email code verification failed',
          error instanceof Error ? error : new Error('Email code verification failed'),
          {
            userId: user.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        );
        if (error instanceof Error) {
          if (error.message.includes('not found') || error.message.includes('expired')) {
            throw new BadRequestException('users.errors.codeNotFoundOrExpired');
          }
          if (error.message.includes('Invalid')) {
            throw new BadRequestException('users.errors.invalidCode');
          }
        }
        throw error;
      }
    } else {
      if (!phone) {
        throw new BadRequestException('users.errors.phoneRequired');
      }

      try {
        this.logger.info('[ONBOARDING] Verifying phone code', { userId: user.id, phone });
        await this.smsService.verifyCode(phone, dto.code);

        if (!onboardingState.completedSteps.includes('1.5')) {
          onboardingState.completedSteps.push('1.5');
        }
        if (!onboardingState.completedSteps.includes('1.6')) {
          onboardingState.completedSteps.push('1.6');
        }

        this.logger.info('[ONBOARDING] Phone code verified successfully', {
          userId: user.id,
          completedSteps: onboardingState.completedSteps,
        });
      } catch (error) {
        this.logger.error(
          '[ONBOARDING] Phone code verification failed',
          error instanceof Error ? error : new Error('Phone code verification failed'),
          {
            userId: user.id as string,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        );
        if (error instanceof Error) {
          if (error.message.includes('not found') || error.message.includes('expired')) {
            throw new BadRequestException('users.errors.codeNotFoundOrExpired');
          }
          if (error.message.includes('Invalid')) {
            throw new BadRequestException('users.errors.invalidCode');
          }
        }
        throw error;
      }
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

    let nextStep: string | null = null;
    if (dto.type === 'email') {
      nextStep = 'phoneForm';
    } else {
      nextStep = 'passwordForm';
    }

    return {
      success: true,
      message: 'Code verified successfully',
      userId: updated.id,
      onboardingState: updated.onboardingState,
      nextStep,
    };
  }

  async updateUserOnboarding(userId: string, dto: UpdateUserOnboardingDto) {
    this.logger.info('[ONBOARDING] Updating user onboarding data', {
      userId,
      fields: Object.keys(dto),
    });

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn('[ONBOARDING] User not found', { userId });
      throw new NotFoundException('users.errors.userNotFound');
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
      this.logger.info('[ONBOARDING] Processing liveness verification', { userId });

      const validaEnabled = this.appConfigService.isValidaEnabled();

      if (!validaEnabled) {
        this.logger.info('[ONBOARDING] Using simple photo validation (Valida disabled)', { userId });
        dataToUpdate.livenessImage = dto.livenessImage;
        dataToUpdate.livenessVerifiedAt = new Date();
        completedStep = '1.11';
        if (!currentState.completedSteps.includes('1.11')) currentState.completedSteps.push('1.11');
        if (!currentState.completedSteps.includes('1.12')) currentState.completedSteps.push('1.12');

        if (user.email) {
          await this.notificationService.sendEmail({
            to: user.email,
            subject: 'Selfie recebida',
            text: 'We received your selfie for proof-of-life verification.',
          });
        }

        this.logger.info('[ONBOARDING] Simple liveness verification completed', { userId });
      } else {
        this.logger.info('[ONBOARDING] Valida enabled - liveness should be processed via /api/users/user/liveness', {
          userId,
        });
      }
    }

    if (completedStep && !currentState.completedSteps.includes(completedStep)) {
      currentState.completedSteps.push(completedStep);
    }

    const requiredUserSteps = ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', '1.10', '1.11', '1.12'];
    const allUserStepsCompleted = requiredUserSteps.every((step) => currentState.completedSteps.includes(step));

    if (allUserStepsCompleted && !currentState.completedSteps.includes('1.13')) {
      currentState.completedSteps.push('1.13');
      this.logger.info('[ONBOARDING] All user onboarding steps completed', { userId });
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

    this.logger.info('[ONBOARDING] User onboarding data updated successfully', {
      userId,
      completedStep,
      totalCompletedSteps: currentState.completedSteps.length,
    });

    return {
      success: true,
      message: 'Data updated successfully',
      user: updated,
      onboardingState: updated.onboardingState,
    };
  }

  async startIdentityOnboarding(userId: string, dto: StartIdentityOnboardingDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const country = ((dto.country || dto.countryCode || 'br').toLowerCase() as 'ar' | 'br');

    const existingIdentity = await this.prisma.usersIdentities.findFirst({
      where: { userId, country: country as 'ar' | 'br', deletedAt: null },
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
    const onboardingState = (identity.users_usersIdentities_userIdTousers?.onboardingState as any) || { completedSteps: [], needsCorrection: [] };

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

    const state = onboardingState as any;
    if (!state.completedSteps || !Array.isArray(state.completedSteps)) {
      state.completedSteps = [];
    }
    if (!state.completedSteps.includes('2.2')) state.completedSteps.push('2.2');

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

    const onboardingState = (user.onboardingState as any) || { completedSteps: [], needsCorrection: [] };

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

    const state = onboardingState as any;
    if (!state.completedSteps || !Array.isArray(state.completedSteps)) {
      state.completedSteps = [];
    }
    if (!state.completedSteps.includes('2.2')) state.completedSteps.push('2.2');
    if (!state.completedSteps.includes('documentVerificationSuccess.ar'))
      state.completedSteps.push('documentVerificationSuccess.ar');

    userUpdates.onboardingState = onboardingState;

    await this.prisma.users.update({ where: { id: userId }, data: userUpdates });

    if (user.email) {
      await this.notificationService.sendEmail({
        to: user.email,
        subject: 'Documento recebido',
        text: 'We received your Argentine document for validation.',
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

    const state = (identity.users_usersIdentities_userIdTousers?.onboardingState as any) || { completedSteps: [], needsCorrection: [] };
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

    const state = (identity.users_usersIdentities_userIdTousers?.onboardingState as any) || { completedSteps: [] };
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
