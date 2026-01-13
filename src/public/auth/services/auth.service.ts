import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID, randomBytes } from 'crypto';
const bcrypt = require('bcrypt');

import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { JwtService, JwtPayload } from '../../../shared/jwt/jwt.service';
import { PasswordHelper } from '../../../shared/helpers/password.helper';
import { NotificationService } from '../../../shared/notifications/notifications.service';
import { AccessLogService } from '../../../shared/access-log/access-log.service';
import { CronosService } from '../../../shared/cronos/cronos.service';
import { ExchangeRatesService } from '../../../shared/exchange/exchange-rates.service';
import { SystemVersionService } from '../../../shared/helpers/system-version.service';
import { SmsService } from '../../../shared/sms/sms.service';
import { EmailService } from '../../../shared/email/email.service';
import { SignupDto } from '../dto/signup.dto';
import { SigninDto } from '../dto/signin.dto';
import {
  SendEmailValidationDto,
  VerifyEmailCodeDto,
} from '../dto/email-validation.dto';
import {
  SendPhoneValidationDto,
  VerifyPhoneCodeDto,
} from '../dto/phone-validation.dto';
import {
  ForgotPasswordDto,
  VerifyPasswordDto,
  UnlockAccountDto,
} from '../dto/password-recovery.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
    private accessLogService: AccessLogService,
    private cronosService: CronosService,
    private exchangeRatesService: ExchangeRatesService,
    private systemVersionService: SystemVersionService,
    private logger: LoggerService,
    private smsService: SmsService,
    private emailService: EmailService,
  ) {}

  private generateNumericCode(length = 8): string {
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

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  private async hashCode(code: string): Promise<string> {
    return bcrypt.hash(code, 10);
  }

  private async isCodeValid(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
  }

  async signup(dto: SignupDto) {
    const email = this.normalizeEmail(dto.email);
    const phone = this.normalizePhone(dto.phone);

    const existingUser = await this.prisma.users.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('users.errors.userAlreadyExists');
    }

    const emailValidated = await this.prisma.email_validation_codes.findFirst({
      where: {
        email,
        verified: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (!emailValidated) {
      throw new BadRequestException('users.errors.emailValidationRequired');
    }

    const phoneValidated = await this.prisma.phone_validation_codes.findFirst({
      where: {
        phone,
        verified: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (!phoneValidated) {
      throw new BadRequestException('users.errors.phoneValidationRequired');
    }

    const hashedPassword = await PasswordHelper.hash(dto.password);
    const onboardingState = {
      completedSteps: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7'],
      needsCorrection: [],
    };

    const user = await this.prisma.users.create({
      data: {
        id: randomUUID(),
        status: 'pending',
        access: 'user',
        email,
        username: email.split('@')[0],
        phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        name:
          dto.firstName && dto.lastName
            ? `${dto.firstName} ${dto.lastName}`
            : dto.firstName || dto.lastName || email,
        language: dto.language || 'es',
        password: hashedPassword,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        passwordUpdatedAt: new Date(),
        onboardingState,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.prisma.email_validation_codes.deleteMany({ where: { email } });
    await this.prisma.phone_validation_codes.deleteMany({ where: { phone } });

    let deviceRequired = false;
    if (dto.deviceIdentifier) {
      const existingDevice = await this.prisma.devices.findFirst({
        where: {
          userId: user.id,
          deviceIdentifier: dto.deviceIdentifier,
          status: 'active',
        },
      });
      deviceRequired = !existingDevice;
    } else {
      const anyActiveDevice = await this.prisma.devices.findFirst({
        where: { userId: user.id, status: 'active' },
      });
      deviceRequired = !anyActiveDevice;
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email || email,
      roleId: user.id,
    };

    const token = await this.jwtService.generateToken(payload);

    if (deviceRequired) {
      return {
        deviceRequired: true,
        deviceType: 'soft',
        message: 'Device registration required after signup',
        userId: user.id,
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          username: user.username,
        },
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
      accessToken: token,
      expiresIn: 3600,
    };
  }

  async signin(
    dto: SigninDto,
    requestContext?: { ipAddress?: string; userAgent?: string },
  ) {
    try {
      this.systemVersionService.assertVersionValid(dto.systemVersion);
    } catch (versionError) {
      throw new BadRequestException(
        versionError instanceof Error
          ? versionError.message
          : 'users.errors.invalidSystemVersion',
      );
    }

    const identifier = (dto.identifier || (dto as any).email || '').trim();

    if (!identifier) {
      throw new BadRequestException('users.errors.invalidUsername');
    }

    const usernameRegex = /^[A-Za-z0-9]{1,}[\-\_\.]?[A-Za-z0-9]{4,}$/;
    const emailRegex =
      /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (identifier.length > 255) {
      throw new BadRequestException('users.errors.invalidUsername');
    }

    if (!usernameRegex.test(identifier) && !emailRegex.test(identifier)) {
      throw new BadRequestException('users.errors.invalidUsername');
    }

    const where = identifier.includes('@')
      ? { email: this.normalizeEmail(identifier) }
      : { username: identifier.toLowerCase() };

    const user = await this.prisma.users.findFirst({
      where: {
        ...where,
        status: { in: ['pending', 'enable', 'error'] },
        access: {
          in: ['administrator', 'supervisor', 'operator', 'customer', 'user'],
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('users.errors.invalidUsernameOrPassword');
    }

    if (user.status === 'disable') {
      await this.accessLogService.logFailure({
        userId: user.id,
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });
      throw new UnauthorizedException('users.errors.accountLocked');
    }

    if (!user.password) {
      await this.accessLogService.logFailure({
        userId: user.id,
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });
      throw new UnauthorizedException('users.errors.invalidUsernameOrPassword');
    }

    const isPasswordValid = await PasswordHelper.compare(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      await this.accessLogService.logFailure({
        userId: user.id,
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });
      throw new UnauthorizedException('users.errors.invalidUsernameOrPassword');
    }

    let deviceRequired = false;
    if (dto.deviceIdentifier) {
      const activeDevice = await this.prisma.devices.findFirst({
        where: {
          userId: user.id,
          deviceIdentifier: dto.deviceIdentifier,
          status: 'active',
        },
      });
      deviceRequired = !activeDevice;
    } else {
      const anyActiveDevice = await this.prisma.devices.findFirst({
        where: { userId: user.id, status: 'active' },
      });
      deviceRequired = !anyActiveDevice;
    }

    if (deviceRequired) {
      const tempPayload: JwtPayload = {
        userId: user.id,
        email: user.email || identifier,
        roleId: user.id,
      };
      const tempToken = await this.jwtService.generateToken(tempPayload);

      return {
        deviceRequired: true,
        deviceType: 'hard',
        message: 'Device registration required',
        userId: user.id,
        accessToken: tempToken,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
        },
      };
    }

    try {
      const userIdentities = await this.prisma.usersIdentities.findMany({
        where: { userId: user.id },
      });
      const userAccounts = await this.prisma.usersAccounts.findMany({
        where: { userId: user.id },
      });

      await this.cronosService.syncCronosBalance({
        userId: user.id,
        userIdentities: userIdentities.map((id) => ({
          country: id.country || '',
          status: id.status || '',
          taxDocumentNumber: id.taxDocumentNumber || '',
        })),
        userAccounts: userAccounts.map((acc) => ({
          id: acc.id,
          type: acc.type || '',
          status: acc.status || '',
          balance: acc.balance
            ? typeof acc.balance === 'string'
              ? acc.balance
              : acc.balance.toString()
            : '0',
        })),
      });
    } catch (syncError: any) {
      this.logger.warn('Cronos sync error (non-blocking)', {
        error: syncError?.message,
      });
    }

    await this.accessLogService.logSuccess({
      userId: user.id,
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
    });

    await this.prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email || identifier,
      roleId: user.id,
    };

    const token = await this.jwtService.generateToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
      accessToken: token,
      refreshToken: token,
      expiresIn: 3600,
    };
  }

  async sendEmailValidation(dto: SendEmailValidationDto) {
    const result = await this.emailService.sendValidationCode(
      dto.email,
      8,
      5,
      true,
    );

    return {
      message: result.message,
      debug: result.debug,
    };
  }

  async verifyEmailCode(dto: VerifyEmailCodeDto) {
    try {
      const result = await this.emailService.verifyCode(
        dto.email,
        dto.code,
        true,
      );

      const user = await this.prisma.users.findFirst({
        where: { email: this.emailService.normalizeEmail(dto.email) },
      });
      if (user) {
        await this.prisma.users.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date(), updatedAt: new Date() },
        });
      }

      return {
        message: result.message,
        email: result.email,
        nextStep: 'password',
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async sendPhoneValidation(dto: SendPhoneValidationDto) {
    const result = await this.smsService.sendValidationCode(
      dto.phone,
      6,
      5,
      'sms',
    );

    return {
      message: result.message,
      debug: result.debug,
    };
  }

  async verifyPhoneCode(dto: VerifyPhoneCodeDto) {
    try {
      const result = await this.smsService.verifyCode(
        dto.phone,
        dto.code,
        true,
      );

      const user = await this.prisma.users.findFirst({
        where: { phone: this.smsService.normalizePhone(dto.phone) },
      });
      if (user) {
        await this.prisma.users.update({
          where: { id: user.id },
          data: { phoneVerifiedAt: new Date(), updatedAt: new Date() },
        });
      }

      return {
        message: result.message,
        phone: result.phone,
        nextStep: 'password',
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.users.findFirst({ where: { email } });

    if (!user) {
      return { message: 'If email exists, password reset code will be sent' };
    }

    const code = this.generateNumericCode(8);
    const hashed = await this.hashCode(code);

    await this.prisma.users.update({
      where: { id: user.id },
      data: { recovery: hashed, updatedAt: new Date() },
    });

    await this.notificationService.sendPasswordRecovery(
      email,
      code,
      user.language,
    );

    return {
      message: 'Password reset code sent to email',
      debug: process.env.NODE_ENV === 'development' ? code : undefined,
    };
  }

  async verifyPassword(dto: VerifyPasswordDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.users.findFirst({ where: { email } });

    if (!user || !user.recovery) {
      throw new BadRequestException('User not found');
    }

    const isValid = await this.isCodeValid(dto.code, user.recovery);
    if (!isValid) {
      throw new BadRequestException('Invalid code');
    }

    const hashedPassword = await PasswordHelper.hash(dto.newPassword);

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordUpdatedAt: new Date(),
        recovery: null,
        updatedAt: new Date(),
      },
    });

    return {
      message: 'Password updated successfully',
    };
  }

  async unlockAccount(
    dto: UnlockAccountDto,
    requestContext?: { ipAddress?: string; userAgent?: string },
  ) {
    if (!dto.id || dto.id.length > 255) {
      throw new BadRequestException('users.errors.invalidId');
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    if (!uuidRegex.test(dto.id)) {
      throw new BadRequestException('users.errors.invalidId');
    }

    if (!dto.password || dto.password.trim().length === 0) {
      throw new BadRequestException('users.errors.invalidPassword');
    }

    const user = await this.prisma.users.findFirst({
      where: {
        id: dto.id,
        status: { in: ['pending', 'enable', 'error', 'disable'] },
        access: {
          in: ['administrator', 'supervisor', 'operator', 'customer', 'user'],
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('users.errors.invalidUsernameOrPassword');
    }

    if (!user.password) {
      throw new UnauthorizedException('users.errors.invalidUsernameOrPassword');
    }

    const isPasswordValid = await PasswordHelper.compare(
      dto.password.trim(),
      user.password,
    );

    if (!isPasswordValid) {
      await this.accessLogService.logFailure({
        userId: user.id,
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });
      throw new UnauthorizedException('users.errors.invalidUsernameOrPassword');
    }

    try {
      this.systemVersionService.assertVersionValid(dto.systemVersion);
    } catch (versionError) {
      throw new BadRequestException(
        versionError instanceof Error
          ? versionError.message
          : 'users.errors.invalidSystemVersion',
      );
    }

    if (user.status === 'disable') {
      await this.prisma.users.update({
        where: { id: user.id },
        data: {
          status: 'enable',
          unlockToken: null,
          updatedAt: new Date(),
        },
      });

      await this.accessLogService.logSuccess({
        userId: user.id,
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });

      const updatedUser = await this.prisma.users.findUnique({
        where: { id: user.id },
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

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email || '',
        roleId: user.id,
      };

      const token = await this.jwtService.generateToken(payload);

      return {
        user: updatedUser,
        accessToken: token,
        refreshToken: token,
        expiresIn: 3600,
        message: 'Account unlocked successfully',
      };
    }

    throw new BadRequestException('users.errors.accountNotLocked');
  }

  async getToken() {
    const payload: JwtPayload = {
      userId: 'anonymous',
      email: 'anonymous@system.local',
      roleId: 'anonymous',
    };

    const token = await this.jwtService.generateToken(payload);

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: 3600,
    };
  }
}
