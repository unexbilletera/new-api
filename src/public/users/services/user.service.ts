import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PasswordHelper } from '../../../shared/helpers/password.helper';
import { ExchangeRatesService, ExchangeRates } from '../../../shared/exchange/exchange-rates.service';
import { SystemVersionService } from '../../../shared/helpers/system-version.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { AppConfigService } from '../../../shared/config/config.service';
import { ValidaService } from '../../../shared/valida/valida.service';
import { AccessLogService } from '../../../shared/access-log/access-log.service';
import { EmailService } from '../../../shared/email/email.service';
import {
  UpdateUserProfileDto,
  CloseAccountDto,
  LivenessCheckDto,
  SendMessageDto,
  SetDefaultIdentityDto,
  SetDefaultAccountDto,
  SetUserAccountAliasDto,
  ChangePasswordDto,
  RequestEmailChangeDto,
  ConfirmEmailChangeDto,
  UpdateAddressDto,
} from '../dto/user-profile.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private exchangeRatesService: ExchangeRatesService,
    private systemVersionService: SystemVersionService,
    private logger: LoggerService,
    private configService: ConfigService,
    private appConfigService: AppConfigService,
    private validaService: ValidaService,
    private accessLogService: AccessLogService,
    private emailService: EmailService,
  ) {}

  async getCurrentUser(userId: string, systemVersion?: string) {
    this.logger.info('[PROFILE] Getting current user', { userId });

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
      this.logger.warn('[PROFILE] User not found', { userId });
      throw new NotFoundException('users.errors.userNotFound');
    }

    const onboardingState = (user.onboardingState as any) || {
      completedSteps: [],
      needsCorrection: [],
    };

    let forceUpgrade = false;
    if (systemVersion) {
      const versionResult = this.systemVersionService.validateVersion(systemVersion);
      forceUpgrade = !versionResult.isValid;
    }

    let exchangeRates: ExchangeRates | null = null;
    try {
      exchangeRates = await this.exchangeRatesService.getRates();
      this.logger.debug('[PROFILE] Exchange rates obtained successfully');
    } catch (mantecaError: any) {
      this.logger.warn('[PROFILE] Manteca getRates failed (non-critical)', { error: mantecaError.message });
      exchangeRates = null;
    }

    const response = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        status: user.status,
        access: user.access,
        language: user.language,
        country: user.country,
        birthdate: user.birthdate,
        gender: user.gender,
        maritalStatus: user.maritalStatus,
        pep: user.pep,
        pepSince: user.pepSince,
        fatherName: user.fatherName,
        motherName: user.motherName,
        emailVerifiedAt: user.emailVerifiedAt,
        phoneVerifiedAt: user.phoneVerifiedAt,
        livenessVerifiedAt: user.livenessVerifiedAt,
        onboardingState: onboardingState,
        usersIdentities: user.usersIdentities_usersIdentities_userIdTousers,
        usersAccounts: user.usersAccounts,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      forceUpgrade,
      exchangeRates,
    };

    this.logger.info('[PROFILE] Current user retrieved successfully', { userId });
    return response;
  }

  async requestEmailChange(userId: string, dto: RequestEmailChangeDto) {
    this.logger.info('[EMAIL CHANGE] Requesting email change', { userId, newEmail: dto.newEmail });

    const emailRegex =
      /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!dto.newEmail || !emailRegex.test(dto.newEmail)) {
      throw new BadRequestException('users.errors.invalidEmail');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const normalizedNewEmail = dto.newEmail.toLowerCase().trim();
    if (user.email && user.email.toLowerCase().trim() === normalizedNewEmail) {
      throw new BadRequestException('users.errors.emailAlreadyInUse');
    }

    const exists = await this.prisma.users.findFirst({
      where: {
        email: normalizedNewEmail,
        id: { not: userId },
      },
      select: { id: true },
    });
    if (exists) {
      throw new BadRequestException('users.errors.duplicatedEmail');
    }

    const sendResult = await this.emailService.sendValidationCode(normalizedNewEmail, 8, 10, false);

    const tokenPayload = {
      type: 'email_change',
      newEmail: normalizedNewEmail,
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };

    const notes =
      (user.notes || '') +
      `${new Date().toISOString()} - EMAIL CHANGE REQUESTED to: ${normalizedNewEmail}\n`;

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        verifyToken: JSON.stringify(tokenPayload),
        notes,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'users.messages.emailChangeCodeSent',
      email: normalizedNewEmail,
      expiresIn: sendResult.expiresIn,
      debug: sendResult.debug,
    };
  }

  async confirmEmailChange(userId: string, dto: ConfirmEmailChangeDto) {
    this.logger.info('[EMAIL CHANGE] Confirming email change', { userId, newEmail: dto.newEmail });

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const tokenStr = user.verifyToken || '';
    let token: any = null;
    try {
      token = tokenStr ? JSON.parse(tokenStr) : null;
    } catch {
      token = null;
    }

    if (!token || token.type !== 'email_change') {
      throw new BadRequestException('users.errors.noPendingEmailChange');
    }

    const normalizedNewEmail = dto.newEmail.toLowerCase().trim();
    if (normalizedNewEmail !== token.newEmail) {
      throw new BadRequestException('users.errors.invalidEmailChangeRequest');
    }

    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      throw new BadRequestException('users.errors.codeExpired');
    }

    await this.emailService.verifyCode(normalizedNewEmail, dto.code, false);

    const exists = await this.prisma.users.findFirst({
      where: {
        email: normalizedNewEmail,
        id: { not: userId },
      },
      select: { id: true },
    });
    if (exists) {
      throw new BadRequestException('users.errors.duplicatedEmail');
    }

    const notes =
      (user.notes || '') +
      `${new Date().toISOString()} - EMAIL CHANGED from: ${user.email || ''} to: ${normalizedNewEmail}\n`;

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        email: normalizedNewEmail,
        emailVerifiedAt: new Date(),
        verifyToken: null,
        notes,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'users.messages.emailChangedSuccessfully',
      email: normalizedNewEmail,
    };
  }

  async updateAddress(userId: string, dto: UpdateAddressDto) {
    const required = ['zipCode', 'street', 'number', 'city', 'state'] as const;
    for (const k of required) {
      if (!dto[k] || String(dto[k]).trim().length === 0) {
        throw new BadRequestException('users.errors.invalidAddress');
      }
    }

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

    let targetIdentityId = user.defaultUserIdentityId || null;
    if (!targetIdentityId) {
      const identities = user.usersIdentities_usersIdentities_userIdTousers || [];
      identities.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      targetIdentityId = identities[0]?.id || null;
    }
    if (!targetIdentityId) {
      throw new BadRequestException('users.errors.identityNotFound');
    }

    const addressPayload = {
      zipCode: String(dto.zipCode).trim(),
      street: String(dto.street).trim(),
      number: String(dto.number).trim(),
      neighborhood: dto.neighborhood ? String(dto.neighborhood).trim() : null,
      city: String(dto.city).trim(),
      state: String(dto.state).trim(),
      complement: dto.complement ? String(dto.complement).trim() : null,
    };

    await this.prisma.usersIdentities.update({
      where: { id: targetIdentityId },
      data: {
        address: JSON.stringify(addressPayload),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      address: addressPayload,
    };
  }
  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    this.logger.info('[PROFILE] Updating user profile', { userId, fields: Object.keys(dto) });

    const user = await this.prisma.users.findFirst({
      where: {
        id: userId,
        status: { in: ['pending', 'enable', 'error'] },
        access: { in: ['administrator', 'supervisor', 'operator', 'customer', 'user'] },
      },
    });

    if (!user) {
      this.logger.warn('[PROFILE] User not found or invalid status', { userId });
      throw new NotFoundException('users.errors.userNotFound');
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (dto.firstName) {
      const formattedFirstName = this.formatName(dto.firstName);
      if (!formattedFirstName || formattedFirstName.trim().length < 2) {
        throw new BadRequestException('users.errors.invalidFirstName');
      }
      updateData.firstName = formattedFirstName;
    }

    if (dto.lastName) {
      const formattedLastName = this.formatName(dto.lastName);
      if (!formattedLastName || formattedLastName.trim().length < 2) {
        throw new BadRequestException('users.errors.invalidLastName');
      }
      updateData.lastName = formattedLastName;
    }

    if (dto.firstName && dto.lastName) {
      updateData.name = `${dto.firstName} ${dto.lastName}`;
    } else if (dto.firstName && user.lastName) {
      updateData.name = `${dto.firstName} ${user.lastName}`;
    } else if (dto.lastName && user.firstName) {
      updateData.name = `${user.firstName} ${dto.lastName}`;
    }

    if (dto.phone) {
      const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
      if (!phoneRegex.test(dto.phone)) {
        throw new BadRequestException('users.errors.invalidPhone');
      }
      updateData.phone = dto.phone;
    }

    if (dto.language) {
      updateData.language = dto.language;
    }

    if (dto.country) {
      if (!['ar', 'br'].includes(dto.country)) {
        throw new BadRequestException('users.errors.invalidCountry');
      }
      updateData.country = dto.country;
    }

    if (dto.birthdate) {
      const birthdateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
      if (!birthdateRegex.test(dto.birthdate)) {
        throw new BadRequestException('users.errors.invalidBirthdate');
      }
      updateData.birthdate = new Date(dto.birthdate);
    }

    if (dto.gender) {
      if (!['male', 'female'].includes(dto.gender)) {
        throw new BadRequestException('users.errors.invalidGender');
      }
      updateData.gender = dto.gender;
    }

    if (dto.maritalStatus) {
      const validStatuses = ['single', 'married', 'divorced', 'widowed', 'cohabiting', 'separated'];
      if (!validStatuses.includes(dto.maritalStatus)) {
        throw new BadRequestException('users.errors.invalidMaritalStatus');
      }
      updateData.maritalStatus = dto.maritalStatus;
    }

    if (dto.profilePicture) {
      if (dto.profilePicture.url) {
        updateData.image = dto.profilePicture.url;
      }
    }

    const updated = await this.prisma.users.update({
      where: { id: userId },
      data: updateData,
    });

    this.logger.info('[PROFILE] User profile updated successfully', { userId });

    return {
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        name: updated.name,
        language: updated.language,
        country: updated.country,
        birthdate: updated.birthdate,
        gender: updated.gender,
        maritalStatus: updated.maritalStatus,
        image: updated.image,
      },
    };
  }

  private formatName(name: string): string {
    if (!name) return '';
    return name
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    requestContext?: { ipAddress?: string; userAgent?: string },
  ) {
    this.logger.info('[PASSWORD] Password change requested', { userId });

    if (!dto.currentPassword || !dto.newPassword) {
      throw new BadRequestException('users.errors.currentPasswordAndNewPasswordRequired');
    }

    if (!dto.newPassword.match(/^\d{6}$/)) {
      throw new BadRequestException('users.errors.invalidPassword');
    }

    const user = await this.prisma.users.findFirst({
      where: {
        id: userId,
        status: { in: ['pending', 'enable', 'error'] },
        access: { in: ['administrator', 'supervisor', 'operator', 'customer', 'user'] },
      },
    });

    if (!user) {
      this.logger.warn('[PASSWORD] User not found or invalid status', { userId });
      throw new NotFoundException('users.errors.userNotFound');
    }

    if (!user.password) {
      this.logger.warn('[PASSWORD] User has no password set', { userId });
      throw new BadRequestException('users.errors.passwordNotSet');
    }

    const isCurrentPasswordValid = await PasswordHelper.compare(
      dto.currentPassword.trim(),
      user.password,
    );

    if (!isCurrentPasswordValid) {
      this.logger.warn('[PASSWORD] Invalid current password', { userId });
      await this.accessLogService.logFailure({
        userId: user.id,
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });
      throw new UnauthorizedException('users.errors.invalidCurrentPassword');
    }

    if (dto.currentPassword.trim() === dto.newPassword.trim()) {
      throw new BadRequestException('users.errors.newPasswordMustBeDifferent');
    }

    const hashedNewPassword = await PasswordHelper.hash(dto.newPassword.trim());

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        passwordUpdatedAt: new Date(),
        recovery: null,
        accessToken: null,
        unlockToken: null,
        updatedAt: new Date(),
      },
    });

    await this.accessLogService.logSuccess({
      userId: user.id,
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
    });

    this.logger.info('[PASSWORD] Password changed successfully', { userId });

    return {
      success: true,
      message: 'users.messages.passwordChangedSuccessfully',
    };
  }

  async signout(userId: string, deviceId?: string) {
    const user = await this.prisma.users.findFirst({
      where: {
        id: userId,
        status: { in: ['pending', 'enable', 'error'] },
        access: { in: ['administrator', 'supervisor', 'operator', 'customer', 'user'] },
      },
    });

    if (user) {
      await this.prisma.users.update({
        where: { id: user.id },
        data: {
          accessToken: null,
          unlockToken: null,
        },
      });
    }

    return { accessToken: null };
  }

  async closeAccount(userId: string, dto: CloseAccountDto) {
    const user = await this.prisma.users.findFirst({
      where: {
        id: userId,
        status: { in: ['pending', 'enable', 'error'] },
        access: { in: ['administrator', 'supervisor', 'operator', 'customer', 'user'] },
      },
    });

    if (!user) {
      throw new NotFoundException('users.errors.invalidContextUser');
    }

    const isPasswordValid = await PasswordHelper.compare(dto.password, user.password || '');
    if (!isPasswordValid) {
      throw new BadRequestException('users.errors.invalidPassword');
    }

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        accessToken: null,
        unlockToken: null,
        status: 'disable',
      },
    });

    return { accessToken: null };
  }

  async livenessCheck(userId: string, dto: LivenessCheckDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const validaEnabled = this.appConfigService.isValidaEnabled();

    if (!validaEnabled) {
      if (!dto.image) {
        throw new BadRequestException('users.errors.imageRequired');
    }

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        livenessImage: dto.image,
        livenessVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
        data: {
          text: '',
          url: '',
        },
        next: 'verifySuccess',
      };
    }

    const result: {
      data: {
        text: string;
        url: string;
      };
      next: string | null;
    } = {
      data: {
        text: '',
        url: '',
      },
      next: null,
    };

    if (user.status === 'pending' || !user.livenessVerifiedAt) {
      try {
        if (!user.validaId) {
          let validaEnrollment;
          try {
            validaEnrollment = await this.validaService.createEnrollment({
              refId: String(user.number),
              enrollmentFlow: 'l',
              baseUrl: this.configService.get<string>('APP_BASE_URL'),
              apiPath: '/api',
            });
          } catch (error) {
            this.logger.warn('[VALIDA] Failed to create enrollment, trying to get status', {
              error: (error as Error).message,
            });
            validaEnrollment = await this.validaService.getEnrollmentStatus({
              refId: String(user.number),
            });
          }

          if (validaEnrollment && validaEnrollment.url) {
            const parts = validaEnrollment.url.split('/').filter(Boolean);
            const validaId = parts[parts.length - 1];

            const notes = (user.notes || '') + 
              `${new Date().toISOString()} - VALIDA ENROLLMENT CREATED validaId: ${validaId}\n`;

            await this.prisma.users.update({
              where: { id: user.id },
              data: {
                validaId: validaId,
                notes: notes,
              },
            });

            result.next = 'verifyValida';
            result.data.url = validaEnrollment.url;
          } else {
            this.logger.warn('[VALIDA] Enrollment response missing URL', {
              userId: user.id,
              userNumber: user.number,
              enrollmentResponse: validaEnrollment,
            });
          }
        } else if (user.validaId) {
          const validaEnrollment = await this.validaService.getEnrollmentInfo({
            refId: String(user.number),
          });

          if (
            validaEnrollment &&
            validaEnrollment.enrollment &&
            validaEnrollment.enrollment.status === 'success'
          ) {
            const livenessVerifiedAt = new Date();
            let livenessImage: string | null = null;

            if (validaEnrollment.images && validaEnrollment.images.selfie) {
              livenessImage = validaEnrollment.images.selfie;
            }

            const notes = (user.notes || '') + 
              `${new Date().toISOString()} - VALIDA ENROLLMENT VERIFIED validaId: ${user.validaId}\n`;

            const currentOnboardingState = (user.onboardingState as any) || {
              completedSteps: [],
              needsCorrection: [],
            };

            if (!Array.isArray(currentOnboardingState.completedSteps)) {
              currentOnboardingState.completedSteps = [];
            }

            if (!currentOnboardingState.completedSteps.includes('1.11')) {
              currentOnboardingState.completedSteps.push('1.11');
            }
            if (!currentOnboardingState.completedSteps.includes('1.12')) {
              currentOnboardingState.completedSteps.push('1.12');
            }

            await this.prisma.users.update({
              where: { id: user.id },
              data: {
                access: 'customer',
                livenessVerifiedAt: livenessVerifiedAt,
                livenessImage: livenessImage,
                notes: notes,
                onboardingState: currentOnboardingState,
              },
            });

            result.next = 'verifySuccess';
          } else if (
            validaEnrollment.enrollment &&
            ['failed', 'system-error'].includes(validaEnrollment.enrollment.status || '')
          ) {
            const notes = (user.notes || '') + 
              `${new Date().toISOString()} - VALIDA ENROLLMENT ERROR validaId: ${user.validaId}\n`;

            await this.prisma.users.update({
              where: { id: user.id },
              data: {
                status: 'error',
                notes: notes,
              },
            });

            result.next = 'verifyWarning';
            result.data.text = 'Hubo un problema para iniciar el proceso para tu identidad.';
          } else if (
            validaEnrollment.enrollment &&
            ['new', 'incomplete', 'funnel-end', 'funnel_end'].includes(
              validaEnrollment.enrollment.status || ''
            )
          ) {
            const notes = (user.notes || '') + 
              `${new Date().toISOString()} - VALIDA ENROLLMENT PROCESS validaId: ${user.validaId}\n`;

            await this.prisma.users.update({
              where: { id: user.id },
              data: { notes: notes },
            });

            const validaConfig = this.appConfigService.getValidaConfig();
            result.next = 'verifyValida';
            result.data.url = `${validaConfig.apiUrl}/../e/${user.validaId}`;
          } else if (
            validaEnrollment.enrollment &&
            validaEnrollment.enrollment.status === 'void'
          ) {
            const notes = (user.notes || '') + 
              `${new Date().toISOString()} - VALIDA ENROLLMENT CANCELED validaId: ${user.validaId}\n`;

            const newEnrollment = await this.validaService.createEnrollment({
              refId: String(user.number),
              enrollmentFlow: 'l',
              baseUrl: this.configService.get<string>('APP_BASE_URL'),
              apiPath: '/api',
            });

            if (newEnrollment && newEnrollment.url) {
              const parts = newEnrollment.url.split('/').filter(Boolean);
              const newValidaId = parts[parts.length - 1];

              await this.prisma.users.update({
                where: { id: user.id },
                data: {
                  validaId: newValidaId,
                  notes: notes + `${new Date().toISOString()} - VALIDA ENROLLMENT CREATED validaId: ${newValidaId}\n`,
                },
              });

              result.next = 'verifyValida';
              result.data.url = newEnrollment.url;
            }
          }
        }
      } catch (error) {
        this.logger.error('[VALIDA] Error in liveness check', error);
        if (dto.image) {
          await this.prisma.users.update({
            where: { id: userId },
            data: {
              livenessImage: dto.image,
              livenessVerifiedAt: new Date(),
              updatedAt: new Date(),
            },
          });

          return {
            data: {
              text: '',
              url: '',
            },
            next: 'verifySuccess',
          };
        }
        throw error;
      }
    }

    return result;
  }

  async sendMessage(userId: string, dto: SendMessageDto) {
    return {
      message: 'Message sent successfully',
    };
  }

  async getUserIdentities(userId: string) {
    const identities = await this.prisma.usersIdentities.findMany({
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

    return { identities };
  }

  async setDefaultIdentity(userId: string, dto: SetDefaultIdentityDto) {
    await this.prisma.users.update({
      where: { id: userId },
      data: { defaultUserIdentityId: dto.identityId },
    });

    return { message: 'Default identity set' };
  }

  async setDefaultAccount(userId: string, dto: SetDefaultAccountDto) {
    await this.prisma.users.update({
      where: { id: userId },
      data: { defaultUserAccountId: dto.accountId },
    });

    return { message: 'Default account set' };
  }

  async setUserAccountAlias(userId: string, accountId: string, alias: string) {
    await this.prisma.usersAccounts.update({
      where: { id: accountId },
      data: { alias },
    });

    return { message: 'Account alias updated' };
  }

  async onboarding(userId: string, step?: string) {
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

    return {
      message: 'Onboarding data processed',
      onboardingState: user.onboardingState,
      nextStep: 'identity_verification',
    };
  }

  async getAccountBalances(userId: string) {
    const accounts = await this.prisma.usersAccounts.findMany({
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

    return { accounts };
  }

  async getUserAccountInfo(accountId: string) {
    const account = await this.prisma.usersAccounts.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('users.errors.accountNotFound');
    }

    return { account };
  }

  async getSailpointInfo(sailpointId: string) {
    return {
      message: 'Sailpoint info retrieved',
    };
  }
}
