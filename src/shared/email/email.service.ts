import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/config.service';
import { NotificationService } from '../notifications/notifications.service';
import { LoggerService } from '../logger/logger.service';
const bcrypt = require('bcrypt');

export interface SendEmailCodeResult {
  success: boolean;
  message: string;
  email: string;
  expiresIn: number;
  debug?: string;
}

export interface VerifyEmailCodeResult {
  success: boolean;
  message: string;
  email: string;
}

@Injectable()
export class EmailService {
  constructor(
    private prisma: PrismaService,
    private appConfigService: AppConfigService,
    private notificationService: NotificationService,
    private logger: LoggerService,
  ) {}

  private generateNumericCode(length: number = 8): string {
    return parseInt(randomBytes(length).toString('hex'), 16)
      .toString()
      .substring(0, length)
      .padStart(length, '0');
  }

  normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  async sendValidationCode(
    email: string,
    codeLength: number = 8,
    expiresInMinutes: number = 5,
    updateUserRecovery: boolean = true,
  ): Promise<SendEmailCodeResult> {
    const normalizedEmail = this.normalizeEmail(email);
    const emailMockEnabled = this.appConfigService.isEmailMockEnabled();
    const mockCode = this.appConfigService.getMockCode8Digits();

    const code = this.generateNumericCode(codeLength);

    const hashedCode = bcrypt.hashSync(code, 10);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await this.prisma.email_validation_codes.upsert({
      where: { email: normalizedEmail },
      update: {
        code: hashedCode,
        verified: false,
        verifiedAt: null,
        expiresAt: expiresAt,
      },
      create: {
        id: require('crypto').randomUUID(),
        email: normalizedEmail,
        code: hashedCode,
        expiresAt: expiresAt,
      },
    });

    if (updateUserRecovery) {
      const existingUser = await this.prisma.users.findFirst({
        where: { email: normalizedEmail },
      });
      if (existingUser) {
        await this.prisma.users.update({
          where: { id: existingUser.id },
          data: { recovery: hashedCode, updatedAt: new Date() },
        });
      }
    }

    try {
      await this.notificationService.sendEmailVerificationCode(
        normalizedEmail,
        code,
        expiresInMinutes,
      );
      this.logger.info('[EMAIL] Validation code sent', {
        email: normalizedEmail,
      });
    } catch (error) {
      this.logger.error('[EMAIL] Failed to send validation code', error, {
        email: normalizedEmail,
      });
      throw error;
    }

    return {
      success: true,
      message: 'Validation code sent to email',
      email: normalizedEmail,
      expiresIn: expiresInMinutes * 60,
      debug: emailMockEnabled ? mockCode : undefined,
    };
  }

  async verifyCode(
    email: string,
    code: string,
    extendExpiration: boolean = true,
  ): Promise<VerifyEmailCodeResult> {
    const normalizedEmail = this.normalizeEmail(email);

    const record = await this.prisma.email_validation_codes.findFirst({
      where: {
        email: normalizedEmail,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw new Error('Code not found or expired');
    }

    const isValid = await this.validateCode(code, record.code);

    if (!isValid) {
      throw new Error('Invalid code');
    }

    const updateData: any = {
      verified: true,
      verifiedAt: new Date(),
    };

    if (extendExpiration) {
      updateData.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    }

    await this.prisma.email_validation_codes.update({
      where: { email: normalizedEmail },
      data: updateData,
    });

    return {
      success: true,
      message: 'Email verified successfully',
      email: normalizedEmail,
    };
  }

  async validateCode(code: string, storedHash: string): Promise<boolean> {
    const mockCodesEnabled = this.appConfigService.isMockCodesEnabled();
    const mockCode = this.appConfigService.getMockCode8Digits();

    if (mockCodesEnabled && code === mockCode) {
      this.logger.info('[EMAIL VALIDATION] Mock code accepted', {
        code: code,
      });
      return true;
    }

    return bcrypt.compareSync(code, storedHash);
  }

  isMockCode(code: string): boolean {
    if (!this.appConfigService.isMockCodesEnabled()) {
      return false;
    }
    return code === this.appConfigService.getMockCode8Digits();
  }
}
