import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';

export interface CronosConfig {
  enable: boolean;
  apiUrl: string;
  username: string;
  password: string;
  userPassword: string;
  logging?: boolean;
}

export interface CronosBalanceResponse {
  amount?: number;
  balance?: number;
}

export interface SyncCronosParams {
  userId: string;
  userIdentities?: Array<{
    country: string;
    status: string;
    taxDocumentNumber: string;
  }>;
  userAccounts?: Array<{
    id: string;
    type: string;
    status: string;
    balance: string | number;
  }>;
}

@Injectable()
export class CronosService {
  private appToken: string | null = null;
  private appTokenExpiry: number = 0;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  private getCronosConfig(): CronosConfig {
    return {
      enable: this.configService.get<boolean>('CRONOS_ENABLE', false),
      apiUrl: this.configService.get<string>('CRONOS_API_URL', ''),
      username: this.configService.get<string>('CRONOS_USERNAME', ''),
      password: this.configService.get<string>('CRONOS_PASSWORD', ''),
      userPassword: this.configService.get<string>('CRONOS_USER_PASSWORD', ''),
      logging: this.configService.get<boolean>('CRONOS_LOGGING', false),
    };
  }  private async getAppToken(): Promise<string> {
    const config = this.getCronosConfig();
    const now = Date.now();

    if (this.appToken && this.appTokenExpiry > now + 300000) {
      return this.appToken;
    }

    const response = await fetch(`${config.apiUrl}/api/v1/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: config.username,
        password: config.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cronos auth failed: ${response.status}`);
    }

    const data = await response.json();
    this.appToken = data.token || data.accessToken;
    this.appTokenExpiry = now + (data.expiresIn || 3600) * 1000;

    return this.appToken!;
  }  private async getUserToken(document: string): Promise<string> {
    const config = this.getCronosConfig();

    const response = await fetch(`${config.apiUrl}/api/v1/auth/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document,
        password: config.userPassword,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cronos user auth failed: ${response.status}`);
    }

    const data = await response.json();
    return data.token || data.accessToken;
  }  private async request<T>(params: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    action: string;
    body?: any;
    document?: string;
    useUserAuth?: boolean;
  }): Promise<T> {
    const config = this.getCronosConfig();

    if (!config.enable) {
      throw new Error('Cronos not available');
    }

    const token = params.useUserAuth && params.document
      ? await this.getUserToken(params.document)
      : await this.getAppToken();

    if (config.logging) {
      this.logger.info('helpers.cronos.request params', {
        url: `${params.method} ${config.apiUrl}${params.action}`,
        body: params.body,
      });
    }

    const response = await fetch(`${config.apiUrl}${params.action}`, {
      method: params.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: params.body ? JSON.stringify(params.body) : undefined,
    });

    const data = await response.json();

    if (data && data.success === false) {
      this.logger.error('helpers.cronos.request error', undefined, data);
      throw new Error(data.message || 'Cronos request failed');
    }

    if (config.logging) {
      this.logger.info('helpers.cronos.request success', data);
    }

    return data as T;
  }  async getAccountBalance(params: { document: string }): Promise<CronosBalanceResponse> {
    return this.request<CronosBalanceResponse>({
      method: 'GET',
      action: '/api/v1/account/balance',
      document: params.document,
      useUserAuth: true,
    });
  }  async closeAccount(params: { document: string }): Promise<any> {
    return this.request({
      method: 'GET',
      action: '/api/v1/account/closingaccount',
      document: params.document,
      useUserAuth: true,
    });
  }  async syncCronosBalance(params: SyncCronosParams): Promise<void> {
    try {
      const config = this.getCronosConfig();
      if (!config.enable) {
        return;
      }

      this.logger.info('[SYNC CRONOS BALANCE] Iniciando sincronização', { userId: params.userId });

      const brIdentity = params.userIdentities?.find(
        (id) => id.country === 'br' && id.status === 'enable'
      );

      if (!brIdentity) {
        this.logger.warn('[SYNC CRONOS BALANCE] Usuário não possui identidade BR ativa', { userId: params.userId });
        return;
      }

      const cronosAccount = params.userAccounts?.find(
        (acc) => acc.type === 'cronos' && acc.status === 'enable'
      );

      if (!cronosAccount) {
        this.logger.warn('[SYNC CRONOS BALANCE] Usuário não possui conta Cronos ativa', { userId: params.userId });
        return;
      }

      const unexBalance = parseFloat(String(cronosAccount.balance || 0));

      this.logger.info('[SYNC CRONOS BALANCE] Saldo Unex (Cronos)', {
        accountId: cronosAccount.id,
        balance: unexBalance,
        document: brIdentity.taxDocumentNumber,
      });

      let cronosBalance = 0;
      try {
        const cronosResponse = await this.getAccountBalance({
          document: brIdentity.taxDocumentNumber,
        });
        cronosBalance = parseFloat(String(cronosResponse?.amount || cronosResponse?.balance || 0));

        this.logger.info('[SYNC CRONOS BALANCE] Saldo Cronos (API)', {
          balance: cronosBalance,
          document: brIdentity.taxDocumentNumber,
        });
      } catch (cronosError: any) {
        this.logger.error('[SYNC CRONOS BALANCE] Erro ao consultar saldo Cronos', cronosError);
        return;
      }

      const difference = Math.abs(unexBalance - cronosBalance);
      const tolerance = 0.01;

      if (difference > tolerance) {
        this.logger.warn('[SYNC CRONOS BALANCE] DISCREPÂNCIA DETECTADA', {
          unexBalance,
          cronosBalance,
          difference,
          discrepancyPercentage: ((difference / Math.max(unexBalance, cronosBalance)) * 100).toFixed(2) + '%',
        });

        try {
          this.logger.info('[SYNC CRONOS BALANCE] Iniciando ajuste de saldo', { accountId: cronosAccount.id });
          const balanceBefore = cronosAccount.balance;

          await this.prisma.usersAccounts.update({
            where: { id: cronosAccount.id },
            data: { balance: cronosBalance.toString() },
          });

          this.logger.info('[SYNC CRONOS BALANCE] Saldo BRL ajustado com sucesso', {
            accountId: cronosAccount.id,
            userId: params.userId,
            balanceBefore,
            balanceAfter: cronosBalance,
            difference: Number(balanceBefore) - cronosBalance,
          });
        } catch (adjustError: any) {
          this.logger.error('[SYNC CRONOS BALANCE] Erro ao ajustar saldo', adjustError);
        }
      } else {
        this.logger.info('[SYNC CRONOS BALANCE] Saldos sincronizados', {
          unexBalance,
          cronosBalance,
          difference,
        });
      }
    } catch (error: any) {
      this.logger.error('[SYNC CRONOS BALANCE] Erro geral', error);

    }
  }
}
