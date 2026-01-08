import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/config.service';
import { NotificationService } from '../notifications/notifications.service';
import { LoggerService } from '../logger/logger.service';
const bcrypt = require('bcrypt');

export interface SendSmsCodeResult {
  success: boolean;
  message: string;
  phone: string;
  expiresIn: number;
  debug?: string;
}

export interface VerifySmsCodeResult {
  success: boolean;
  message: string;
  phone: string;
}

@Injectable()
export class SmsService {
  constructor(
    private prisma: PrismaService,
    private appConfigService: AppConfigService,
    private notificationService: NotificationService,
    private logger: LoggerService,
  ) {}

  private generateNumericCode(length: number = 6): string {
    return parseInt(randomBytes(length).toString('hex'), 16)
      .toString()
      .substring(0, length)
      .padStart(length, '0');
  }

  normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  async sendValidationCode(
    phone: string,
    codeLength: number = 6,
    expiresInMinutes: number = 5,
    method: string = 'sms',
    language?: string,
  ): Promise<SendSmsCodeResult> {
    const normalizedPhone = this.normalizePhone(phone);
    const smsMockEnabled = this.appConfigService.isSmsMockEnabled();
    const mockCode = this.appConfigService.getMockCode6Digits();

    const code = this.generateNumericCode(codeLength);

    const hashedCode = bcrypt.hashSync(code, 10);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await this.prisma.phone_validation_codes.upsert({
      where: { phone: normalizedPhone },
      update: {
        code: hashedCode,
        method: method,
        verified: false,
        verifiedAt: null,
        expiresAt: expiresAt,
        language: language,
      },
      create: {
        id: require('crypto').randomUUID(),
        phone: normalizedPhone,
        code: hashedCode,
        method: method,
        expiresAt: expiresAt,
        language: language,
      },
    });

    try {
      await this.notificationService.sendPhoneVerificationCode(
        normalizedPhone,
        code,
        expiresInMinutes,
      );
      this.logger.info('[SMS] Validation code sent', {
        phone: normalizedPhone,
        method: method,
      });
    } catch (error) {
      this.logger.error('[SMS] Failed to send validation code', error, {
        phone: normalizedPhone,
      });
      throw error;
    }

    return {
      success: true,
      message: 'Validation code sent to phone',
      phone: normalizedPhone,
      expiresIn: expiresInMinutes * 60,
      debug: smsMockEnabled ? mockCode : undefined,
    };
  }

  async verifyCode(
    phone: string,
    code: string,
    extendExpiration: boolean = true,
  ): Promise<VerifySmsCodeResult> {
    const normalizedPhone = this.normalizePhone(phone);

    const record = await this.prisma.phone_validation_codes.findFirst({
      where: {
        phone: normalizedPhone,
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

    await this.prisma.phone_validation_codes.update({
      where: { phone: normalizedPhone },
      data: updateData,
    });

    return {
      success: true,
      message: 'Phone verified successfully',
      phone: normalizedPhone,
    };
  }

  async validateCode(code: string, storedHash: string): Promise<boolean> {
    const mockCodesEnabled = this.appConfigService.isMockCodesEnabled();
    const mockCode = this.appConfigService.getMockCode6Digits();

    if (mockCodesEnabled && code === mockCode) {
      this.logger.info('[SMS VALIDATION] Mock code accepted', {
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
    return code === this.appConfigService.getMockCode6Digits();
  }
}
