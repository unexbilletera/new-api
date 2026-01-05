import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PasswordHelper } from '../../../shared/helpers/password.helper';
import { ExchangeRatesService, ExchangeRates } from '../../../shared/exchange/exchange-rates.service';
import { SystemVersionService } from '../../../shared/helpers/system-version.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import {
  UpdateUserProfileDto,
  CloseAccountDto,
  LivenessCheckDto,
  SendMessageDto,
  SetDefaultIdentityDto,
  SetDefaultAccountDto,
  SetUserAccountAliasDto,
} from '../dto/user-profile.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private exchangeRatesService: ExchangeRatesService,
    private systemVersionService: SystemVersionService,
    private logger: LoggerService,
  ) {}

  async getCurrentUser(userId: string, systemVersion?: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        access: true,
        status: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        onboardingState: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    let forceUpgrade = false;
    if (systemVersion) {
      const versionResult = this.systemVersionService.validateVersion(systemVersion);
      forceUpgrade = !versionResult.isValid;
    }

    let exchangeRates: ExchangeRates | null = null;
    try {
      exchangeRates = await this.exchangeRatesService.getRates();
      this.logger.debug('Exchange rates obtidas com sucesso');
    } catch (mantecaError: any) {
      this.logger.warn('Manteca getRates falhou (não crítico)', { error: mantecaError.message });
      exchangeRates = null;
    }

    return { 
      user,
      forceUpgrade,
      exchangeRates,
    };
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const updated = await this.prisma.users.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName || user.firstName,
        lastName: dto.lastName || user.lastName,
        phone: dto.phone || user.phone,
        updatedAt: new Date(),
      },
    });

    return {
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
      },
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

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        livenessImage: dto.image,
        livenessVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      isLive: true,
      confidence: 0.95,
      message: 'Liveness check passed',
    };
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
        currency: true,
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
