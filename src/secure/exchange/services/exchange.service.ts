import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  ExchangeRatesService,
  ExchangeRates,
} from '../../../shared/exchange/exchange-rates.service';
import { RateCodeService } from './rate-code.service';
import { SpendingLimitsService } from '../../../shared/spending-limits/spending-limits.service';
import { MantecaService } from '../../../shared/manteca/manteca.service';
import { v4 as uuidv4 } from 'uuid';

export interface ConvertParams {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  operation?: 'buy' | 'sell';
}

export interface ConvertResult {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rate: number;
  convertedAmount: number;
  commissionRate: number;
  commissionAmount: number;
  totalDebit: number;
  operation: 'buy' | 'sell';
}

export interface BulkRatesParams {
  amounts: number[];
  fromCurrency: string;
  toCurrency: string;
}

export interface BulkRatesResult {
  rates: {
    amount: number;
    convertedAmount: number;
    rate: number;
  }[];
  fromCurrency: string;
  toCurrency: string;
  commissionRate: number;
}

export interface PreviewParams {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  operation?: 'buy' | 'sell';
}

export interface PreviewResult {
  rateCode: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rate: number;
  convertedAmount: number;
  commissionRate: number;
  commissionAmount: number;
  totalDebit: number;
  expiresAt: Date;
  expiresInSeconds: number;
}

export interface ConfirmParams {
  rateCode: string;
  userId: string;
  userIdentityId: string;
  sourceAccountId: string;
  targetAccountId?: string;
}

export interface ConfirmResult {
  success: boolean;
  transactionId: string;
  message: string;
  details: {
    fromCurrency: string;
    toCurrency: string;
    amount: number;
    rate: number;
    convertedAmount: number;
    totalDebit: number;
  };
}

@Injectable()
export class ExchangeService {
  private readonly logger = new Logger(ExchangeService.name);

  constructor(
    private prisma: PrismaService,
    private exchangeRatesService: ExchangeRatesService,
    private rateCodeService: RateCodeService,
    private spendingLimitsService: SpendingLimitsService,
    private mantecaService: MantecaService,
  ) {}

  /**
   * Get current exchange rates
   */
  async getRates(): Promise<ExchangeRates> {
    return this.exchangeRatesService.getRates();
  }

  /**
   * Calculate conversion
   */
  async convert(params: ConvertParams): Promise<ConvertResult> {
    const { fromCurrency, toCurrency, amount, operation } = params;

    if (!fromCurrency || !toCurrency || !amount) {
      throw new BadRequestException(
        'Missing required parameters: fromCurrency, toCurrency, amount',
      );
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const rates = await this.getRates();

    let rate: number;
    let commissionRate: number;
    let inferredOperation: 'buy' | 'sell';

    const fromUpper = fromCurrency.toUpperCase();
    const toUpper = toCurrency.toUpperCase();

    if (fromUpper === 'BRL' && toUpper === 'ARS') {
      rate = rates.brl_ars_sell;
      commissionRate = rates.commission_rate_sell;
      inferredOperation = 'sell';
    } else if (fromUpper === 'ARS' && toUpper === 'BRL') {
      rate = rates.ars_brl_buy;
      commissionRate = rates.commission_rate_buy;
      inferredOperation = 'buy';
    } else {
      throw new BadRequestException(
        `Unsupported currency pair: ${fromCurrency}/${toCurrency}`,
      );
    }

    const convertedAmount = amount * rate;
    const commissionAmount = amount * commissionRate;
    const totalDebit = amount;

    return {
      fromCurrency: fromUpper,
      toCurrency: toUpper,
      amount,
      rate,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      commissionRate,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      totalDebit: Math.round(totalDebit * 100) / 100,
      operation: operation || inferredOperation,
    };
  }

  /**
   * Get bulk rates for multiple amounts
   */
  async getBulkRates(params: BulkRatesParams): Promise<BulkRatesResult> {
    const { amounts, fromCurrency, toCurrency } = params;

    if (!amounts || !amounts.length || !fromCurrency || !toCurrency) {
      throw new BadRequestException(
        'Missing required parameters: amounts, fromCurrency, toCurrency',
      );
    }

    const rates = await this.getRates();

    const fromUpper = fromCurrency.toUpperCase();
    const toUpper = toCurrency.toUpperCase();

    let rate: number;
    let commissionRate: number;

    if (fromUpper === 'BRL' && toUpper === 'ARS') {
      rate = rates.brl_ars_sell;
      commissionRate = rates.commission_rate_sell;
    } else if (fromUpper === 'ARS' && toUpper === 'BRL') {
      rate = rates.ars_brl_buy;
      commissionRate = rates.commission_rate_buy;
    } else {
      throw new BadRequestException(
        `Unsupported currency pair: ${fromCurrency}/${toCurrency}`,
      );
    }

    const ratesResult = amounts.map((amount) => ({
      amount,
      convertedAmount: Math.round(amount * rate * 100) / 100,
      rate,
    }));

    return {
      rates: ratesResult,
      fromCurrency: fromUpper,
      toCurrency: toUpper,
      commissionRate,
    };
  }

  /**
   * Create preview with rate code
   */
  async preview(params: PreviewParams, userId: string): Promise<PreviewResult> {
    const conversion = await this.convert(params);

    const rateCodeData = await this.rateCodeService.createRateCode({
      userId,
      fromCurrency: conversion.fromCurrency,
      toCurrency: conversion.toCurrency,
      operation: conversion.operation,
      amount: conversion.amount,
      rate: conversion.rate,
      convertedAmount: conversion.convertedAmount,
      commissionRate: conversion.commissionRate,
      commissionAmount: conversion.commissionAmount,
      totalDebit: conversion.totalDebit,
      metadata: {
        createdAt: new Date().toISOString(),
        source: 'exchange-preview',
      },
    });

    const expiresAt = new Date(rateCodeData.expires_at);
    const now = new Date();
    const expiresInSeconds = Math.floor(
      (expiresAt.getTime() - now.getTime()) / 1000,
    );

    return {
      rateCode: rateCodeData.rate_code,
      fromCurrency: conversion.fromCurrency,
      toCurrency: conversion.toCurrency,
      amount: conversion.amount,
      rate: conversion.rate,
      convertedAmount: conversion.convertedAmount,
      commissionRate: conversion.commissionRate,
      commissionAmount: conversion.commissionAmount,
      totalDebit: conversion.totalDebit,
      expiresAt,
      expiresInSeconds,
    };
  }

  /**
   * Confirm exchange with rate code
   */
  async confirm(params: ConfirmParams): Promise<ConfirmResult> {
    const { rateCode, userId, userIdentityId, sourceAccountId } = params;

    const validation = await this.rateCodeService.validateRateCode(
      rateCode,
      userId,
    );

    if (!validation.valid || !validation.rateCodeData) {
      throw new BadRequestException(validation.message || 'Invalid rate code');
    }

    const rateCodeData = validation.rateCodeData;

    const country =
      await this.spendingLimitsService.getIdentityCountry(userIdentityId);
    const limitCheck = await this.spendingLimitsService.checkSpendingLimitV2({
      userIdentityId,
      amount: rateCodeData.total_debit,
      operationType: 'transfer',
      country,
    });

    if (!limitCheck.allowed) {
      throw new BadRequestException(
        'Spending limit exceeded: ' + limitCheck.message,
      );
    }

    const transactionId = uuidv4();
    const now = new Date();

    const transactionType =
      country === 'ar'
        ? 'cashout_manteca_exchange_ar'
        : 'cashout_manteca_exchange_br';

    const sourceAccount = await this.prisma.usersAccounts.findUnique({
      where: { id: sourceAccountId },
    });

    if (!sourceAccount) {
      throw new BadRequestException('Source account not found');
    }

    const transaction = await this.prisma.transactions.create({
      data: {
        id: transactionId,
        date: now,
        type: transactionType as any,
        status: 'pending',
        sourceUserId: userId,
        sourceIdentityId: userIdentityId,
        sourceAccountId,
        sourceCvu: sourceAccount.cvu,
        amount: rateCodeData.total_debit,
        reason: `Exchange ${rateCodeData.from_currency} -> ${rateCodeData.to_currency}`,
        country,
        currency: rateCodeData.from_currency,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.rateCodeService.markRateCodeAsUsed(rateCode, transactionId);

    await this.spendingLimitsService.updateSpendingV2({
      userIdentityId,
      amount: rateCodeData.total_debit,
      operationType: 'transfer',
      country,
    });

    await this.prisma.transactionsLogs.create({
      data: {
        id: uuidv4(),
        transactionId,
        userId,
        initialStatus: null,
        finalStatus: 'pending',
        context: 'exchangeConfirm',
        params: JSON.stringify({
          rateCode,
          fromCurrency: rateCodeData.from_currency,
          toCurrency: rateCodeData.to_currency,
          amount: rateCodeData.amount,
          rate: rateCodeData.rate,
        }),
        result: JSON.stringify({ success: true }),
        createdAt: now,
        updatedAt: now,
      },
    });

    this.logger.log(
      `Exchange confirmed: ${transactionId} - ${rateCodeData.from_currency} -> ${rateCodeData.to_currency}`,
    );

    return {
      success: true,
      transactionId,
      message: 'Exchange initiated successfully',
      details: {
        fromCurrency: rateCodeData.from_currency,
        toCurrency: rateCodeData.to_currency,
        amount: rateCodeData.amount,
        rate: rateCodeData.rate,
        convertedAmount: rateCodeData.converted_amount,
        totalDebit: rateCodeData.total_debit,
      },
    };
  }
}
