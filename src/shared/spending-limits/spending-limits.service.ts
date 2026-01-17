import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

interface LimitsResult {
  dailyTransferLimit: Decimal | null;
  dailyBoletoLimit: Decimal | null;
  nightlyTransferLimit: Decimal | null;
  nightlyBoletoLimit: Decimal | null;
  nightlyStartHour: number | null;
  nightlyEndHour: number | null;
  limitsAr: any;
  limitsBr: any;
}

interface CheckLimitParams {
  userIdentityId: string;
  amount: number;
  type: 'transfer' | 'boleto' | 'qrCode' | 'pix';
  currency?: string;
  transactionId?: string;
}

interface CheckLimitResult {
  allowed: boolean;
  canProceed: boolean;
  remaining: number;
  remainingLimit: number;
  limit: number;
  currentLimit: number;
  currentSpent: number;
  attemptedAmount: number;
  isNightTime: boolean;
  limitType: 'daily' | 'nightly';
  alertType: string;
  message: string;
}

interface CheckLimitV2Params {
  userIdentityId: string;
  amount: number;
  operationType: 'transfer' | 'qrCode' | 'pix';
  currency?: string;
  country?: 'ar' | 'br';
}

interface TransactionLimitResult {
  allowed: boolean;
  canProceed: boolean;
  limit: number | null;
  isUnlimited: boolean;
  attemptedAmount?: number;
  remaining?: number;
  message: string;
}

interface DailyLimitResult {
  allowed: boolean;
  canProceed: boolean;
  countAllowed: boolean;
  valueAllowed: boolean;
  maxDaily: number | null;
  maxCountDaily: number | null;
  currentSpent: number;
  currentCount: number;
  countRemaining: number | null;
  valueRemaining: number | null;
  isUnlimited: boolean;
  message: string;
}

interface MonthlyLimitResult {
  allowed: boolean;
  canProceed: boolean;
  skip?: boolean;
  limit?: number | null;
  currentSpent?: number;
  attemptedAmount?: number;
  remaining?: number;
  isUnlimited?: boolean;
  message: string;
}

interface CheckLimitV2Result {
  allowed: boolean;
  canProceed: boolean;
  country: 'ar' | 'br';
  currency: string;
  transactionLimit: TransactionLimitResult;
  dailyLimit: DailyLimitResult;
  monthlyLimit: MonthlyLimitResult;
  message: string;
}

@Injectable()
export class SpendingLimitsService {
  private readonly logger = new Logger(SpendingLimitsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check if a value is unlimited (null or undefined)
   */
  isUnlimited(value: any): boolean {
    return value === null || value === undefined;
  }

  /**
   * Check if it's nighttime based on start/end hours
   */
  isNightTime(startHour: number | null, endHour: number | null): boolean {
    if (startHour === null || endHour === null) {
      return false;
    }
    const now = new Date();
    const currentHour = now.getHours();

    if (startHour > endHour) {
      return currentHour >= startHour || currentHour < endHour;
    } else {
      return currentHour >= startHour && currentHour < endHour;
    }
  }

  /**
   * Get default profile ID
   */
  async getDefaultProfileId(): Promise<string | null> {
    try {
      const defaultProfile =
        await this.prisma.spending_limit_profiles.findFirst({
          where: {
            isDefault: true,
            isActive: true,
            deletedAt: null,
          },
          select: { id: true },
        });

      if (defaultProfile) {
        return defaultProfile.id;
      }

      const profile1 = await this.prisma.spending_limit_profiles.findUnique({
        where: { id: '11111111-1111-1111-1111-111111111111' },
        select: { id: true },
      });

      if (profile1) {
        return profile1.id;
      }

      const anyProfile = await this.prisma.spending_limit_profiles.findFirst({
        where: {
          isActive: true,
          deletedAt: null,
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });

      return anyProfile?.id || null;
    } catch (error) {
      this.logger.error('Error getting default profile:', error);
      return '11111111-1111-1111-1111-111111111111';
    }
  }

  /**
   * Get identity country
   */
  async getIdentityCountry(userIdentityId: string): Promise<'ar' | 'br'> {
    const identity = await this.prisma.usersIdentities.findUnique({
      where: { id: userIdentityId },
      select: { country: true },
    });

    if (!identity) {
      throw new Error('Identity not found');
    }

    return identity.country === 'ar' ? 'ar' : 'br';
  }

  /**
   * Get identity limits (V1 format)
   */
  async getIdentityLimits(userIdentityId: string): Promise<LimitsResult> {
    this.logger.debug(`Getting limits for userIdentityId: ${userIdentityId}`);

    const identityLimit =
      await this.prisma.user_identity_spending_limits.findFirst({
        where: {
          userIdentityId,
          deletedAt: null,
        },
      });

    if (!identityLimit) {
      this.logger.warn(
        `Spending limits not found for identity: ${userIdentityId}`,
      );
      throw new Error('Spending limits not found for this identity');
    }

    if (identityLimit.isCustom) {
      return {
        dailyTransferLimit: identityLimit.dailyTransferLimit,
        dailyBoletoLimit: identityLimit.dailyBoletoLimit,
        nightlyTransferLimit: identityLimit.nightlyTransferLimit,
        nightlyBoletoLimit: identityLimit.nightlyBoletoLimit,
        nightlyStartHour: identityLimit.nightlyStartHour,
        nightlyEndHour: identityLimit.nightlyEndHour,
        limitsAr: identityLimit.limitsAr,
        limitsBr: identityLimit.limitsBr,
      };
    }

    if (!identityLimit.profileId) {
      throw new Error('Profile ID not found for this identity');
    }

    const profile = await this.prisma.spending_limit_profiles.findUnique({
      where: { id: identityLimit.profileId },
    });

    if (!profile) {
      throw new Error('Profile not found for this identity');
    }

    return {
      dailyTransferLimit: profile.dailyTransferLimit,
      dailyBoletoLimit: profile.dailyBoletoLimit,
      nightlyTransferLimit: profile.nightlyTransferLimit,
      nightlyBoletoLimit: profile.nightlyBoletoLimit,
      nightlyStartHour: profile.nightlyStartHour,
      nightlyEndHour: profile.nightlyEndHour,
      limitsAr: profile.limitsAr,
      limitsBr: profile.limitsBr,
    };
  }

  /**
   * Get country-specific limits
   */
  async getCountryLimits(
    userIdentityId: string,
    country: 'ar' | 'br',
  ): Promise<any> {
    const identityLimit =
      await this.prisma.user_identity_spending_limits.findFirst({
        where: {
          userIdentityId,
          deletedAt: null,
        },
      });

    if (!identityLimit) {
      throw new Error('Spending limits not found for this identity');
    }

    let limits: any = null;

    if (identityLimit.isCustom) {
      limits =
        country === 'ar' ? identityLimit.limitsAr : identityLimit.limitsBr;
    } else {
      if (!identityLimit.profileId) {
        throw new Error('Profile ID not found for this identity');
      }

      const profile = await this.prisma.spending_limit_profiles.findUnique({
        where: { id: identityLimit.profileId },
      });

      if (!profile) {
        throw new Error('Profile not found for this identity');
      }

      limits = country === 'ar' ? profile.limitsAr : profile.limitsBr;
    }

    if (typeof limits === 'string') {
      limits = JSON.parse(limits);
    }

    return limits || {};
  }

  /**
   * Get current daily spending
   */
  async getCurrentSpending(userIdentityId: string, date: string): Promise<any> {
    const spending = await this.prisma.daily_spending_tracking.findFirst({
      where: {
        userIdentityId,
        transactionDate: new Date(date),
      },
    });

    if (!spending) {
      const newSpending = await this.prisma.daily_spending_tracking.create({
        data: {
          userIdentityId,
          transactionDate: new Date(date),
          dailyTransferSpent: 0,
          dailyBoletoSpent: 0,
          nightlyTransferSpent: 0,
          nightlyBoletoSpent: 0,
          transferCount: 0,
          boletoCount: 0,
          dailyQrCodeSpentAr: 0,
          dailyQrCodeSpentBr: 0,
          dailyPixSpentBr: 0,
          qrCodeCountAr: 0,
          qrCodeCountBr: 0,
          pixCountBr: 0,
          transferCountAr: 0,
          transferCountBr: 0,
        },
      });
      return newSpending;
    }

    return spending;
  }

  /**
   * Check spending limit (V1 - day/night)
   */
  async checkSpendingLimit(
    params: CheckLimitParams,
  ): Promise<CheckLimitResult> {
    const { userIdentityId, amount, type, currency = 'USD' } = params;

    if (!userIdentityId || !amount || !type) {
      throw new Error(
        'Missing required parameters: userIdentityId, amount, type',
      );
    }

    const limits = await this.getIdentityLimits(userIdentityId);

    const today = new Date().toISOString().split('T')[0];
    const currentSpending = await this.getCurrentSpending(
      userIdentityId,
      today,
    );

    const isNightTime = this.isNightTime(
      limits.nightlyStartHour,
      limits.nightlyEndHour,
    );

    const applicableLimits = isNightTime
      ? {
          transfer: limits.nightlyTransferLimit,
          boleto: limits.nightlyBoletoLimit,
        }
      : {
          transfer: limits.dailyTransferLimit,
          boleto: limits.dailyBoletoLimit,
        };

    const limitType =
      type === 'transfer' || type === 'pix' || type === 'qrCode'
        ? 'transfer'
        : 'boleto';
    const currentSpent = isNightTime
      ? limitType === 'transfer'
        ? Number(currentSpending.nightlyTransferSpent) || 0
        : Number(currentSpending.nightlyBoletoSpent) || 0
      : limitType === 'transfer'
        ? Number(currentSpending.dailyTransferSpent) || 0
        : Number(currentSpending.dailyBoletoSpent) || 0;

    const limit = Number(applicableLimits[limitType]) || 0;
    const remaining = limit - currentSpent;
    const canProceed = amount <= remaining;

    this.logger.debug('Limit check result:', {
      userIdentityId,
      amount,
      limitType,
      isNightTime,
      limit,
      currentSpent,
      remaining,
      canProceed,
    });

    if (!canProceed) {
      await this.createAlert({
        userIdentityId,
        transactionId: params.transactionId,
        alertType: isNightTime
          ? `nightly_${limitType}_limit`
          : `${limitType}_limit`,
        attemptedAmount: amount,
        currentLimit: limit,
        currentSpent: currentSpent,
      });
    }

    return {
      allowed: canProceed,
      canProceed,
      remaining,
      remainingLimit: remaining,
      limit,
      currentLimit: limit,
      currentSpent,
      attemptedAmount: amount,
      isNightTime,
      limitType: isNightTime ? 'nightly' : 'daily',
      alertType: isNightTime
        ? `nightly_${limitType}_limit`
        : `${limitType}_limit`,
      message: canProceed
        ? 'Transaction allowed'
        : `Spending limit exceeded. Remaining: ${remaining} ${currency}`,
    };
  }

  /**
   * Check transaction limit (max per transaction)
   */
  async checkTransactionLimit(params: {
    userIdentityId: string;
    amount: number;
    operationType: string;
    country: 'ar' | 'br';
    currency?: string;
  }): Promise<TransactionLimitResult> {
    const { userIdentityId, amount, operationType, country } = params;

    const limits = await this.getCountryLimits(userIdentityId, country);

    let limitKey =
      operationType === 'qrCode'
        ? 'qrCode'
        : operationType === 'pix'
          ? 'pix'
          : 'transfer';
    let operationLimits = limits[limitKey] || {};

    let maxPerTransaction = operationLimits.maxPerTransaction;
    if (
      operationType === 'pix' &&
      country === 'br' &&
      this.isUnlimited(maxPerTransaction)
    ) {
      const transferLimits = limits.transfer || {};
      if (!this.isUnlimited(transferLimits.maxPerTransaction)) {
        this.logger.debug(
          `Pix maxPerTransaction not configured, using transfer.maxPerTransaction (${transferLimits.maxPerTransaction}) as fallback`,
        );
        maxPerTransaction = transferLimits.maxPerTransaction;
      }
    }

    if (this.isUnlimited(maxPerTransaction)) {
      return {
        allowed: true,
        canProceed: true,
        limit: null,
        isUnlimited: true,
        message: 'Transaction limit: unlimited',
      };
    }

    const canProceed = amount <= maxPerTransaction;

    return {
      allowed: canProceed,
      canProceed,
      limit: maxPerTransaction,
      attemptedAmount: amount,
      remaining: canProceed ? maxPerTransaction - amount : 0,
      isUnlimited: false,
      message: canProceed
        ? `Transaction within limit: ${amount} <= ${maxPerTransaction}`
        : `Transaction exceeds limit: ${amount} > ${maxPerTransaction}`,
    };
  }

  /**
   * Check daily limit (total value and count)
   */
  async checkDailyLimit(params: {
    userIdentityId: string;
    amount: number;
    operationType: string;
    country: 'ar' | 'br';
    currency?: string;
  }): Promise<DailyLimitResult> {
    const { userIdentityId, amount, operationType, country } = params;

    const limits = await this.getCountryLimits(userIdentityId, country);

    let limitKey =
      operationType === 'qrCode'
        ? 'qrCode'
        : operationType === 'pix'
          ? 'pix'
          : 'transfer';
    let operationLimits = limits[limitKey] || {};

    let maxDaily = operationLimits.maxDaily;
    let maxCountDaily = operationLimits.maxCountDaily;

    if (operationType === 'pix' && country === 'br') {
      if (this.isUnlimited(maxDaily) && this.isUnlimited(maxCountDaily)) {
        const transferLimits = limits.transfer || {};
        if (
          !this.isUnlimited(transferLimits.maxDaily) ||
          !this.isUnlimited(transferLimits.maxCountDaily)
        ) {
          this.logger.debug(
            'Pix daily limits not configured, using transfer limits as fallback',
          );
          maxDaily = maxDaily ?? transferLimits.maxDaily;
          maxCountDaily = maxCountDaily ?? transferLimits.maxCountDaily;
        }
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const currentSpending = await this.getCurrentSpending(
      userIdentityId,
      today,
    );

    let countField = 0;
    if (country === 'ar') {
      if (operationType === 'transfer')
        countField = currentSpending.transferCountAr || 0;
      else if (operationType === 'qrCode')
        countField = currentSpending.qrCodeCountAr || 0;
    } else {
      if (operationType === 'transfer')
        countField = currentSpending.transferCountBr || 0;
      else if (operationType === 'qrCode')
        countField = currentSpending.qrCodeCountBr || 0;
      else if (operationType === 'pix')
        countField = currentSpending.pixCountBr || 0;
    }

    let dailySpentField = 0;
    if (country === 'ar') {
      if (operationType === 'transfer')
        dailySpentField = Number(currentSpending.dailyTransferSpent) || 0;
      else if (operationType === 'qrCode')
        dailySpentField = Number(currentSpending.dailyQrCodeSpentAr) || 0;
    } else {
      if (operationType === 'transfer')
        dailySpentField = Number(currentSpending.dailyTransferSpent) || 0;
      else if (operationType === 'qrCode')
        dailySpentField = Number(currentSpending.dailyQrCodeSpentBr) || 0;
      else if (operationType === 'pix')
        dailySpentField = Number(currentSpending.dailyPixSpentBr) || 0;
    }

    let countAllowed = true;
    let countRemaining: number | null = null;
    if (!this.isUnlimited(maxCountDaily)) {
      countAllowed = countField < maxCountDaily;
      countRemaining = countAllowed ? maxCountDaily - countField - 1 : 0;
    }

    let valueAllowed = true;
    let valueRemaining: number | null = null;
    if (!this.isUnlimited(maxDaily)) {
      const totalAfterTransaction = dailySpentField + amount;
      valueAllowed = totalAfterTransaction <= maxDaily;
      valueRemaining = valueAllowed ? maxDaily - totalAfterTransaction : 0;
    }

    const canProceed = countAllowed && valueAllowed;

    return {
      allowed: canProceed,
      canProceed,
      countAllowed,
      valueAllowed,
      maxDaily,
      maxCountDaily,
      currentSpent: dailySpentField,
      currentCount: countField,
      countRemaining,
      valueRemaining,
      isUnlimited:
        this.isUnlimited(maxDaily) && this.isUnlimited(maxCountDaily),
      message: canProceed
        ? 'Daily limit: within limits'
        : `Daily limit exceeded: ${!countAllowed ? 'count' : 'value'} limit exceeded`,
    };
  }

  /**
   * Check monthly limit (Argentina transfers only)
   */
  async checkMonthlyLimit(params: {
    userIdentityId: string;
    amount: number;
    country: 'ar' | 'br';
    currency?: string;
  }): Promise<MonthlyLimitResult> {
    const { userIdentityId, amount, country } = params;

    if (country !== 'ar') {
      return {
        allowed: true,
        canProceed: true,
        skip: true,
        message: 'Monthly limit only applies to Argentina',
      };
    }

    const limits = await this.getCountryLimits(userIdentityId, country);
    const operationLimits = limits.transfer || {};
    const maxMonthly = operationLimits.maxMonthly;

    if (this.isUnlimited(maxMonthly)) {
      return {
        allowed: true,
        canProceed: true,
        limit: null,
        isUnlimited: true,
        message: 'Monthly limit: unlimited',
      };
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    let monthlySpending =
      await this.prisma.monthly_spending_tracking.findUnique({
        where: {
          userIdentityId_year_month: {
            userIdentityId,
            year,
            month,
          },
        },
      });

    if (!monthlySpending) {
      monthlySpending = await this.prisma.monthly_spending_tracking.create({
        data: {
          userIdentityId,
          year,
          month,
          monthlyTransferSpentAr: 0,
          monthlyTransferSpentBr: 0,
        },
      });
    }

    const currentMonthlySpent =
      Number(monthlySpending.monthlyTransferSpentAr) || 0;
    const canProceed = currentMonthlySpent + amount <= maxMonthly;

    return {
      allowed: canProceed,
      canProceed,
      limit: maxMonthly,
      currentSpent: currentMonthlySpent,
      attemptedAmount: amount,
      remaining: canProceed ? maxMonthly - currentMonthlySpent - amount : 0,
      isUnlimited: false,
      message: canProceed
        ? `Monthly limit: within limit (${currentMonthlySpent + amount} <= ${maxMonthly})`
        : `Monthly limit exceeded: ${currentMonthlySpent + amount} > ${maxMonthly}`,
    };
  }

  /**
   * Complete limit validation (V2 with country and currency support)
   */
  async checkSpendingLimitV2(
    params: CheckLimitV2Params,
  ): Promise<CheckLimitV2Result> {
    const { userIdentityId, amount, operationType, currency, country } = params;

    if (!userIdentityId || !amount || !operationType) {
      throw new Error(
        'Missing required parameters: userIdentityId, amount, operationType',
      );
    }

    const userCountry =
      country || (await this.getIdentityCountry(userIdentityId));

    const expectedCurrency = userCountry === 'ar' ? 'ARS' : 'BRL';

    const transactionLimit = await this.checkTransactionLimit({
      userIdentityId,
      amount,
      operationType,
      country: userCountry,
      currency: currency || expectedCurrency,
    });

    const dailyLimit = await this.checkDailyLimit({
      userIdentityId,
      amount,
      operationType,
      country: userCountry,
      currency: currency || expectedCurrency,
    });

    let monthlyLimit: MonthlyLimitResult = {
      allowed: true,
      skip: true,
      canProceed: true,
      message: 'Monthly limit not applicable',
    };
    if (operationType === 'transfer' && userCountry === 'ar') {
      monthlyLimit = await this.checkMonthlyLimit({
        userIdentityId,
        amount,
        country: userCountry,
        currency: currency || expectedCurrency,
      });
    }

    const allAllowed =
      transactionLimit.allowed && dailyLimit.allowed && monthlyLimit.allowed;

    return {
      allowed: allAllowed,
      canProceed: allAllowed,
      country: userCountry,
      currency: currency || expectedCurrency,
      transactionLimit,
      dailyLimit,
      monthlyLimit,
      message: allAllowed
        ? 'All limits validated successfully'
        : 'One or more limits exceeded',
    };
  }

  /**
   * Update spending after transaction (V1)
   */
  async updateSpending(params: {
    userIdentityId: string;
    amount: number;
    type: 'transfer' | 'boleto';
    currency?: string;
  }): Promise<any> {
    const { userIdentityId, amount, type } = params;

    const today = new Date().toISOString().split('T')[0];

    const limits = await this.getIdentityLimits(userIdentityId);
    const isNightTime = this.isNightTime(
      limits.nightlyStartHour,
      limits.nightlyEndHour,
    );

    const updateData: any = {};
    if (type === 'transfer') {
      if (isNightTime) {
        updateData.nightlyTransferSpent = { increment: amount };
      } else {
        updateData.dailyTransferSpent = { increment: amount };
      }
      updateData.transferCount = { increment: 1 };
    } else {
      if (isNightTime) {
        updateData.nightlyBoletoSpent = { increment: amount };
      } else {
        updateData.dailyBoletoSpent = { increment: amount };
      }
      updateData.boletoCount = { increment: 1 };
    }

    const result = await this.prisma.daily_spending_tracking.upsert({
      where: {
        userIdentityId_transactionDate: {
          userIdentityId,
          transactionDate: new Date(today),
        },
      },
      update: updateData,
      create: {
        userIdentityId,
        transactionDate: new Date(today),
        dailyTransferSpent: type === 'transfer' && !isNightTime ? amount : 0,
        dailyBoletoSpent: type === 'boleto' && !isNightTime ? amount : 0,
        nightlyTransferSpent: type === 'transfer' && isNightTime ? amount : 0,
        nightlyBoletoSpent: type === 'boleto' && isNightTime ? amount : 0,
        transferCount: type === 'transfer' ? 1 : 0,
        boletoCount: type === 'boleto' ? 1 : 0,
        dailyQrCodeSpentAr: 0,
        dailyQrCodeSpentBr: 0,
        dailyPixSpentBr: 0,
        qrCodeCountAr: 0,
        qrCodeCountBr: 0,
        pixCountBr: 0,
        transferCountAr: 0,
        transferCountBr: 0,
      },
    });

    return result;
  }

  /**
   * Update spending after transaction (V2 with country and type support)
   */
  async updateSpendingV2(params: {
    userIdentityId: string;
    amount: number;
    operationType: 'transfer' | 'qrCode' | 'pix';
    country: 'ar' | 'br';
    currency?: string;
  }): Promise<any> {
    const { userIdentityId, amount, operationType, country } = params;

    const today = new Date().toISOString().split('T')[0];
    const updateData: any = {};

    if (country === 'ar') {
      if (operationType === 'transfer') {
        updateData.dailyTransferSpent = { increment: amount };
        updateData.transferCountAr = { increment: 1 };
      } else if (operationType === 'qrCode') {
        updateData.dailyQrCodeSpentAr = { increment: amount };
        updateData.qrCodeCountAr = { increment: 1 };
      }
    } else {
      if (operationType === 'transfer') {
        updateData.dailyTransferSpent = { increment: amount };
        updateData.transferCountBr = { increment: 1 };
      } else if (operationType === 'qrCode') {
        updateData.dailyQrCodeSpentBr = { increment: amount };
        updateData.qrCodeCountBr = { increment: 1 };
      } else if (operationType === 'pix') {
        updateData.dailyPixSpentBr = { increment: amount };
        updateData.pixCountBr = { increment: 1 };
      }
    }

    const dailyResult = await this.prisma.daily_spending_tracking.upsert({
      where: {
        userIdentityId_transactionDate: {
          userIdentityId,
          transactionDate: new Date(today),
        },
      },
      update: updateData,
      create: {
        userIdentityId,
        transactionDate: new Date(today),
        dailyTransferSpent: operationType === 'transfer' ? amount : 0,
        dailyQrCodeSpentAr:
          country === 'ar' && operationType === 'qrCode' ? amount : 0,
        dailyQrCodeSpentBr:
          country === 'br' && operationType === 'qrCode' ? amount : 0,
        dailyPixSpentBr:
          country === 'br' && operationType === 'pix' ? amount : 0,
        transferCountAr:
          country === 'ar' && operationType === 'transfer' ? 1 : 0,
        transferCountBr:
          country === 'br' && operationType === 'transfer' ? 1 : 0,
        qrCodeCountAr: country === 'ar' && operationType === 'qrCode' ? 1 : 0,
        qrCodeCountBr: country === 'br' && operationType === 'qrCode' ? 1 : 0,
        pixCountBr: country === 'br' && operationType === 'pix' ? 1 : 0,
        dailyBoletoSpent: 0,
        nightlyTransferSpent: 0,
        nightlyBoletoSpent: 0,
        transferCount: 0,
        boletoCount: 0,
      },
    });

    if (operationType === 'transfer' && country === 'ar') {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      await this.prisma.monthly_spending_tracking.upsert({
        where: {
          userIdentityId_year_month: {
            userIdentityId,
            year,
            month,
          },
        },
        update: {
          monthlyTransferSpentAr: { increment: amount },
        },
        create: {
          userIdentityId,
          year,
          month,
          monthlyTransferSpentAr: amount,
          monthlyTransferSpentBr: 0,
        },
      });
    }

    return dailyResult;
  }

  /**
   * Map alertType to valid enum values
   */
  private mapAlertTypeToEnum(alertType: string): string {
    if (alertType.includes('nightly')) {
      if (
        alertType.includes('transfer') ||
        alertType.includes('pix') ||
        alertType.includes('qrCode')
      ) {
        return 'nightly_transfer_limit';
      }
      return 'nightly_boleto_limit';
    }

    if (
      alertType.includes('transfer') ||
      alertType.includes('pix') ||
      alertType.includes('qrCode')
    ) {
      return 'transfer_limit';
    }

    if (alertType.includes('boleto')) {
      return 'boleto_limit';
    }

    return 'transfer_limit';
  }

  /**
   * Create spending limit exceeded alert
   */
  async createAlert(params: {
    userIdentityId: string;
    transactionId?: string;
    alertType: string;
    attemptedAmount: number;
    currentLimit: number;
    currentSpent: number;
  }): Promise<any> {
    const {
      userIdentityId,
      transactionId,
      alertType,
      attemptedAmount,
      currentLimit,
      currentSpent,
    } = params;

    if (!userIdentityId || !alertType) {
      throw new Error('Missing required parameters for alert creation');
    }

    const validAlertType = this.mapAlertTypeToEnum(alertType);

    const alert = await this.prisma.spending_limit_alerts.create({
      data: {
        userIdentityId,
        transactionId: transactionId || null,
        alertType: validAlertType as any,
        attemptedAmount,
        currentLimit,
        currentSpent,
        status: 'pending',
      },
    });

    this.logger.log(`Spending limit alert created: ${alert.id}`);
    return alert;
  }

  /**
   * Reset daily limits (cleanup job)
   */
  async resetDailyLimits(): Promise<{
    success: boolean;
    deletedCount: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await this.prisma.daily_spending_tracking.deleteMany({
      where: {
        transactionDate: {
          lt: thirtyDaysAgo,
        },
      },
    });

    this.logger.log(`Reset daily limits: deleted ${deleted.count} old records`);
    return { success: true, deletedCount: deleted.count };
  }

  /**
   * Create or update user identity spending limits
   */
  async assignProfileToUser(
    userIdentityId: string,
    profileId: string,
  ): Promise<any> {
    return this.prisma.user_identity_spending_limits.upsert({
      where: {
        userIdentityId_deletedAt: {
          userIdentityId,
          deletedAt: null as any,
        },
      },
      update: {
        profileId,
        isCustom: false,
        updatedAt: new Date(),
      },
      create: {
        userIdentityId,
        profileId,
        isCustom: false,
      },
    });
  }
}
