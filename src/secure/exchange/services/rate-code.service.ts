import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

export interface RateCodeData {
  id: string;
  rate_code: string;
  user_id: string;
  from_currency: string;
  to_currency: string;
  operation: string;
  amount: number;
  rate: number;
  converted_amount: number;
  commission_rate: number;
  commission_amount: number;
  total_debit: number;
  expires_at: Date;
  created_at: Date;
  used: boolean;
  used_at: Date | null;
  transaction_id: string | null;
  metadata: any;
}

export interface CreateRateCodeParams {
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  operation: 'buy' | 'sell';
  amount: number;
  rate: number;
  convertedAmount: number;
  commissionRate: number;
  commissionAmount: number;
  totalDebit: number;
  metadata?: any;
  expirationMinutes?: number;
}

export interface ValidateRateCodeResult {
  valid: boolean;
  error?: string;
  message?: string;
  rateCodeData?: RateCodeData;
  expiredAt?: Date;
  currentTime?: Date;
  usedAt?: Date;
}

export interface CompareRatesResult {
  changed: boolean;
  differencePercentage: number;
  differenceAbsolute: number;
  oldRate: number;
  newRate: number;
  oldConvertedAmount?: number;
  newConvertedAmount?: number;
}

@Injectable()
export class RateCodeService {
  private readonly logger = new Logger(RateCodeService.name);
  private readonly DEFAULT_EXPIRATION_MINUTES = 2;
  private readonly MAX_CHANGE_PERCENTAGE = 0.05; // 0.05%
  private readonly MAX_CHANGE_ABSOLUTE = 0.01;

  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique rate code
   */
  generateRateCode(): string {
    return uuidv4();
  }

  /**
   * Get expiration minutes from config or default
   */
  private async getExpirationMinutes(): Promise<number> {
    try {
      const config = await this.prisma.system_config.findFirst({
        where: {
          key: 'exchange_rate_code_expiration_minutes',
          isActive: true,
          deletedAt: null,
        },
      });

      if (config?.value) {
        return parseInt(config.value, 10) || this.DEFAULT_EXPIRATION_MINUTES;
      }
    } catch (error) {
      this.logger.warn('Error getting expiration config, using default');
    }

    return this.DEFAULT_EXPIRATION_MINUTES;
  }

  /**
   * Create rate code in database
   */
  async createRateCode(params: CreateRateCodeParams): Promise<RateCodeData> {
    try {
      const rateCode = this.generateRateCode();
      const expirationMinutes =
        params.expirationMinutes || (await this.getExpirationMinutes());

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

      this.logger.debug('Creating rate_code:', {
        rate_code: rateCode,
        user_id: params.userId,
        expires_at: expiresAt.toISOString(),
      });

      const created = await this.prisma.exchange_rate_codes.create({
        data: {
          id: uuidv4(),
          rate_code: rateCode,
          user_id: params.userId,
          from_currency: params.fromCurrency.toUpperCase(),
          to_currency: params.toCurrency.toUpperCase(),
          operation: params.operation.toLowerCase() as any,
          amount: params.amount,
          rate: params.rate,
          converted_amount: params.convertedAmount,
          commission_rate: params.commissionRate,
          commission_amount: params.commissionAmount,
          total_debit: params.totalDebit,
          expires_at: expiresAt,
          metadata: params.metadata || null,
        },
      });

      this.logger.log(`Rate code created: ${created.rate_code}`);

      return {
        id: created.id,
        rate_code: created.rate_code,
        user_id: created.user_id,
        from_currency: created.from_currency,
        to_currency: created.to_currency,
        operation: created.operation,
        amount: Number(created.amount),
        rate: Number(created.rate),
        converted_amount: Number(created.converted_amount),
        commission_rate: Number(created.commission_rate),
        commission_amount: Number(created.commission_amount),
        total_debit: Number(created.total_debit),
        expires_at: created.expires_at,
        created_at: created.created_at,
        used: created.used,
        used_at: created.used_at,
        transaction_id: created.transaction_id,
        metadata: created.metadata,
      };
    } catch (error) {
      this.logger.error('Error creating rate code:', error);
      throw error;
    }
  }

  /**
   * Find rate code by code
   */
  async findRateCode(rateCode: string): Promise<RateCodeData | null> {
    try {
      const found = await this.prisma.exchange_rate_codes.findUnique({
        where: { rate_code: rateCode },
      });

      if (!found) {
        return null;
      }

      return {
        id: found.id,
        rate_code: found.rate_code,
        user_id: found.user_id,
        from_currency: found.from_currency,
        to_currency: found.to_currency,
        operation: found.operation,
        amount: Number(found.amount),
        rate: Number(found.rate),
        converted_amount: Number(found.converted_amount),
        commission_rate: Number(found.commission_rate),
        commission_amount: Number(found.commission_amount),
        total_debit: Number(found.total_debit),
        expires_at: found.expires_at,
        created_at: found.created_at,
        used: found.used,
        used_at: found.used_at,
        transaction_id: found.transaction_id,
        metadata: found.metadata,
      };
    } catch (error) {
      this.logger.error('Error finding rate code:', error);
      return null;
    }
  }

  /**
   * Validate rate code
   */
  async validateRateCode(
    rateCode: string,
    userId: string,
  ): Promise<ValidateRateCodeResult> {
    try {
      this.logger.debug('Validating rate_code:', { rateCode, userId });
      const rateCodeData = await this.findRateCode(rateCode);

      if (!rateCodeData) {
        this.logger.warn('Rate code not found');
        return {
          valid: false,
          error: 'RATE_CODE_NOT_FOUND',
          message: 'Quotation code not found',
        };
      }

      if (rateCodeData.user_id !== userId) {
        this.logger.warn('Rate code user mismatch:', {
          rate_code_user: rateCodeData.user_id,
          request_user: userId,
        });
        return {
          valid: false,
          error: 'RATE_CODE_USER_MISMATCH',
          message: 'Quotation code does not belong to this user',
        };
      }

      if (rateCodeData.used) {
        this.logger.warn('Rate code already used:', {
          used_at: rateCodeData.used_at,
          transaction_id: rateCodeData.transaction_id,
        });
        return {
          valid: false,
          error: 'RATE_CODE_ALREADY_USED',
          message: 'Quotation code has already been used',
          usedAt: rateCodeData.used_at || undefined,
        };
      }

      const now = new Date();
      const expiresAt = new Date(rateCodeData.expires_at);
      const timeLeft = expiresAt.getTime() - now.getTime();

      this.logger.debug('Checking expiration:', {
        expires_at: expiresAt.toISOString(),
        current_time: now.toISOString(),
        time_left_seconds: Math.floor(timeLeft / 1000),
      });

      if (now > expiresAt) {
        this.logger.warn('Rate code expired');
        return {
          valid: false,
          error: 'RATE_EXPIRED',
          message: 'The quotation has expired. Please request a new one.',
          expiredAt: expiresAt,
          currentTime: now,
        };
      }

      this.logger.log('Rate code valid');
      return {
        valid: true,
        rateCodeData,
      };
    } catch (error) {
      this.logger.error('Error validating rate code:', error);
      return {
        valid: false,
        error: 'VALIDATION_ERROR',
        message: 'Error validating quotation code',
      };
    }
  }

  /**
   * Compare rates to detect significant changes
   */
  compareRates(
    oldRate: number,
    newRate: number,
    oldConvertedAmount?: number,
    newConvertedAmount?: number,
  ): CompareRatesResult {
    const differenceAbsolute = Math.abs(newRate - oldRate);
    const differencePercentage = Math.abs((newRate - oldRate) / oldRate) * 100;

    const changed =
      differencePercentage > this.MAX_CHANGE_PERCENTAGE ||
      differenceAbsolute > this.MAX_CHANGE_ABSOLUTE;

    this.logger.debug('Rate comparison:', {
      oldRate,
      newRate,
      differenceAbsolute,
      differencePercentage,
      changed,
      oldConvertedAmount,
      newConvertedAmount,
    });

    return {
      changed,
      differencePercentage,
      differenceAbsolute,
      oldRate,
      newRate,
      oldConvertedAmount,
      newConvertedAmount,
    };
  }

  /**
   * Mark rate code as used
   */
  async markRateCodeAsUsed(
    rateCode: string,
    transactionId: string,
  ): Promise<boolean> {
    try {
      await this.prisma.exchange_rate_codes.update({
        where: { rate_code: rateCode },
        data: {
          used: true,
          used_at: new Date(),
          transaction_id: transactionId,
        },
      });

      this.logger.log(`Rate code marked as used: ${rateCode}`);
      return true;
    } catch (error) {
      this.logger.error('Error marking rate code as used:', error);
      return false;
    }
  }

  /**
   * Cleanup expired rate codes
   */
  async cleanupExpiredRateCodes(hoursOld: number = 24): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - hoursOld);

      const result = await this.prisma.exchange_rate_codes.deleteMany({
        where: {
          expires_at: { lt: cutoffDate },
          used: false,
        },
      });

      this.logger.log(`Cleanup: ${result.count} expired rate codes removed`);
      return result.count;
    } catch (error) {
      this.logger.error('Error cleaning up expired rate codes:', error);
      return 0;
    }
  }
}
