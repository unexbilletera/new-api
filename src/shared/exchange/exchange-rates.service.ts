import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';

export interface ExchangePrice {
  buy: number;
  sell: number;
}

export interface ExchangeRates {
  brl_ars_buy: number;
  brl_ars_sell: number;
  ars_brl_buy: number;
  ars_brl_sell: number;
  brl_ars: number;
  ars_brl: number;
  base_brl_ars: number;
  base_ars_brl: number;
  commission_rate_buy: number;
  commission_rate_sell: number;
  commission_rate: number;
  timestamp: number;
}

export interface ExchangeConfigs {
  commissionRateBuy: number;
  commissionRateSell: number;
  commissionRate: number;
  rateCacheTTL: number;
  baseCurrency: string;
  supportedCurrencies: string[];
}

@Injectable()
export class ExchangeRatesService {
  private ratesCache: ExchangeRates | null = null;
  private configCache: Map<string, { value: any; timestamp: number }> =
    new Map();
  private readonly CONFIG_CACHE_TTL = 60000;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}
  private async getConfig<T>(key: string, defaultValue: T): Promise<T> {
    const cached = this.configCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CONFIG_CACHE_TTL) {
      return cached.value as T;
    }

    try {
      const config = await this.prisma.system_config.findFirst({
        where: { key, isActive: true, deletedAt: null },
      });
      const value = config?.value ?? defaultValue;
      this.configCache.set(key, { value, timestamp: Date.now() });
      return value as T;
    } catch {
      return defaultValue;
    }
  }
  async getExchangeConfigs(): Promise<ExchangeConfigs> {
    const [
      commissionRateBuy,
      commissionRateSell,
      commissionRate,
      rateCacheTTL,
      baseCurrency,
      supportedCurrencies,
    ] = await Promise.all([
      this.getConfig<string | null>('exchange_commission_rate_buy', null),
      this.getConfig<string | null>('exchange_commission_rate_sell', null),
      this.getConfig<number>('exchange_commission_rate', 0.02),
      this.getConfig<number>('exchange_rate_cache_ttl', 300),
      this.getConfig<string>('exchange_base_currency', 'USD'),
      this.getConfig<string>('exchange_supported_currencies', 'BRL,ARS,USD'),
    ]);

    const buyRate =
      commissionRateBuy !== null
        ? Number(commissionRateBuy)
        : Number(commissionRate);
    const sellRate =
      commissionRateSell !== null
        ? Number(commissionRateSell)
        : Number(commissionRate);

    return {
      commissionRateBuy: buyRate,
      commissionRateSell: sellRate,
      commissionRate: Number(commissionRate),
      rateCacheTTL: Number(rateCacheTTL),
      baseCurrency,
      supportedCurrencies: String(supportedCurrencies).split(','),
    };
  }
  private async getPrice(
    type: 'USDT_ARS' | 'USDT_BRL',
  ): Promise<ExchangePrice> {
    const mantecaApiUrl =
      this.configService.get<string>('MANTECA_API_URL') ||
      'https://api.manteca.dev';
    const mantecaApiKey = this.configService.get<string>('MANTECA_API_KEY');

    try {
      const response = await fetch(`${mantecaApiUrl}/v1/price/${type}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(mantecaApiKey && { Authorization: `Bearer ${mantecaApiKey}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Manteca API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        buy: Number(data.buy),
        sell: Number(data.sell),
      };
    } catch (error: any) {
      this.logger.error(
        `helpers.manteca.getPrice error for ${type}`,
        error instanceof Error ? error : undefined,
        { errorMessage: error?.message },
      );
      throw new HttpException('Failed to fetch exchange rate', 503);
    }
  }
  async getRates(): Promise<ExchangeRates> {
    const exchangeConfigs = await this.getExchangeConfigs();
    const {
      commissionRateBuy = 0.02,
      commissionRateSell = 0.02,
      commissionRate = 0.02,
      rateCacheTTL = 300,
    } = exchangeConfigs;
    const rateCacheTTLMs = rateCacheTTL * 1000;

    const needsRecalculation =
      !this.ratesCache ||
      this.ratesCache.timestamp < Date.now() - rateCacheTTLMs ||
      (this.ratesCache.commission_rate_buy !== undefined &&
        this.ratesCache.commission_rate_buy !== commissionRateBuy) ||
      (this.ratesCache.commission_rate_sell !== undefined &&
        this.ratesCache.commission_rate_sell !== commissionRateSell);

    if (needsRecalculation) {
      const [ars, brl] = await Promise.all([
        this.getPrice('USDT_ARS'),
        this.getPrice('USDT_BRL'),
      ]);

      const baseBrlArs = ars.sell / brl.buy;
      const baseArsBrl = ars.buy / brl.sell;

      this.logger.debug('MANTECA RATES - Bases sem comissão', {
        baseBrlArs,
        baseArsBrl,
        commissionRateBuy: `${(commissionRateBuy * 100).toFixed(2)}%`,
        commissionRateSell: `${(commissionRateSell * 100).toFixed(2)}%`,
      });

      const brlArsSell = baseBrlArs * (1 - commissionRateSell);

      const brlArsBuy = baseArsBrl * (1 + commissionRateBuy);

      this.logger.debug('MANTECA RATES - Valores calculados', {
        baseBrlArs: baseBrlArs.toFixed(6),
        baseArsBrl: baseArsBrl.toFixed(6),
        commissionRateBuy: `${(commissionRateBuy * 100).toFixed(2)}%`,
        commissionRateSell: `${(commissionRateSell * 100).toFixed(2)}%`,
        brl_ars_buy: brlArsBuy.toFixed(6),
        brl_ars_sell: brlArsSell.toFixed(6),
      });

      const arsBrlBuy = baseArsBrl * (1 + commissionRateBuy);
      const arsBrlSell = baseArsBrl * (1 - commissionRateSell);

      this.ratesCache = {
        brl_ars_buy: brlArsBuy,
        brl_ars_sell: brlArsSell,
        ars_brl_buy: arsBrlBuy,
        ars_brl_sell: arsBrlSell,
        brl_ars: brlArsBuy,
        ars_brl: arsBrlBuy,
        base_brl_ars: baseBrlArs,
        base_ars_brl: baseArsBrl,
        commission_rate_buy: commissionRateBuy,
        commission_rate_sell: commissionRateSell,
        commission_rate: commissionRate,
        timestamp: Date.now(),
      };
    }

    this.logger.debug('app.config.manteca.rates', this.ratesCache ?? undefined);
    return this.ratesCache!;
  }
  clearCache(): void {
    this.ratesCache = null;
    this.configCache.clear();
  }
}
