import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SocksProxyAgent } from 'socks-proxy-agent';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

interface BindConfig {
  enable: boolean;
  logging: boolean;
  proxy: boolean;
  apiUrl: string;
  username: string;
  password: string;
  bankId: string;
  account: string;
  sslKey: string;
  sslCrt: string;
  sslPassphrase: string;
}

interface BindAuth {
  token: string;
  time: number;
}

@Injectable()
export class BindService implements OnModuleInit {
  private readonly logger = new Logger(BindService.name);
  private config: BindConfig;
  private auth: BindAuth | null = null;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.loadConfig();
  }

  onModuleInit(): void {
    this.loadConfig();
  }

  private loadConfig(): void {
    this.config = {
      enable: this.configService.get<string>('WALLET_BIND', '') === 'enable',
      logging:
        this.configService.get<string>('WALLET_BIND_LOG', '') === 'enable',
      proxy:
        this.configService.get<string>('WALLET_BIND_PROXY', '') === 'enable',
      apiUrl: this.configService.get<string>('WALLET_BIND_URL', ''),
      username: this.configService.get<string>('WALLET_BIND_USERNAME', ''),
      password: this.configService.get<string>('WALLET_BIND_PASSWORD', ''),
      bankId:
        this.configService
          .get<string>('WALLET_BIND_ACCOUNT', '')
          ?.split('-')[0] || '',
      account: this.configService.get<string>('WALLET_BIND_ACCOUNT', ''),
      sslKey: this.configService.get<string>('WALLET_BIND_KEY', ''),
      sslCrt: this.configService.get<string>('WALLET_BIND_CRT', ''),
      sslPassphrase: this.configService.get<string>(
        'WALLET_BIND_PASSPHRASE',
        '',
      ),
    };
  }

  private createBindAgent(): https.Agent | SocksProxyAgent {
    const keyPath = path.join(process.cwd(), 'pem', this.config.sslKey);
    const certPath = path.join(process.cwd(), 'pem', this.config.sslCrt);

    const mstrOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
      passphrase: this.config.sslPassphrase,
    };

    const useProxy =
      this.config.proxy || process.env.USE_SOCKS_PROXY === 'true';

    if (useProxy) {
      if (this.config.logging) {
        this.logger.warn('BIND: Using SOCKS Proxy with mTLS (localhost:8080)');
      }
      try {
        const proxyPort = process.env.SOCKS_PROXY_PORT || '8080';
        return new SocksProxyAgent(
          `socks5h://localhost:${proxyPort}`,
          mstrOptions as any,
        );
      } catch (error: any) {
        const proxyPort = process.env.SOCKS_PROXY_PORT || '8080';
        this.logger.error('BIND: Error creating SOCKS Proxy Agent', error);
        throw new Error(`SOCKS5 proxy not available at localhost:${proxyPort}`);
      }
    } else {
      return new https.Agent(mstrOptions);
    }
  }

  private async getToken(): Promise<string> {
    if (!this.config.enable) {
      throw new Error('Bind not available');
    }

    if (
      this.auth &&
      this.auth.token &&
      new Date().getTime() - this.auth.time < 1000 * 60 * 60
    ) {
      return this.auth.token;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.config.apiUrl}/v1/login/jwt`,
          {
            username: this.config.username,
            password: this.config.password,
          },
          {
            httpsAgent: this.createBindAgent(),
          },
        ),
      );

      const body = response.data;
      if (!body || !body.token) {
        throw new Error('Missing token in response');
      }

      if (this.config.logging) {
        this.logger.log('BIND: Token obtained successfully');
      }

      this.auth = {
        token: `JWT ${body.token}`,
        time: new Date().getTime(),
      };

      return this.auth.token;
    } catch (error: any) {
      this.logger.error('BIND: Error getting token', error);
      throw error;
    }
  }

  private async request(params: {
    method: string;
    action: string;
    body?: any;
    headers?: Record<string, string>;
  }): Promise<any> {
    if (!this.config.enable) {
      throw new Error('Bind not available');
    }

    if (!this.config.apiUrl) {
      throw new Error('Missing apiUrl. Invalid config');
    }

    if (!params.action) {
      throw new Error('Missing action. Invalid parameters');
    }

    if (!params.method) {
      throw new Error('Missing method. Invalid parameters');
    }

    const token = await this.getToken();
    if (!token) {
      throw new Error('Invalid authorization token');
    }

    if (this.config.logging) {
      this.logger.log(
        `BIND request: ${params.method} ${params.action}`,
        params.body,
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: params.method as any,
          url: `${this.config.apiUrl}${params.action}`,
          data: params.body,
          headers: {
            ...params.headers,
            Authorization: token,
            'Content-Type': 'application/json',
          },
          httpsAgent: this.createBindAgent(),
        }),
      );

      if (this.config.logging) {
        this.logger.log('BIND request success', response.data);
      }

      return response.data;
    } catch (error: any) {
      this.logger.error('BIND request error', error);
      throw error;
    }
  }

  async createCvu(params: {
    client_id: string;
    cuit: string;
    name: string;
    currency?: string;
  }): Promise<any> {
    if (!this.config.enable) {
      throw new Error('Bind not available');
    }

    if (!this.config.bankId) {
      throw new Error('Missing bankId. Invalid config');
    }

    if (!this.config.account) {
      throw new Error('Missing account. Invalid config');
    }

    if (!params.client_id) {
      throw new Error('Missing client_id. Invalid parameters');
    }

    if (!params.cuit) {
      throw new Error('Missing cuit. Invalid parameters');
    }

    if (!params.name) {
      throw new Error('Missing name. Invalid parameters');
    }

    try {
      const result = await this.request({
        method: 'POST',
        action: `/v1/banks/${this.config.bankId}/accounts/${this.config.account}/owner/wallet/cvu`,
        body: {
          client_id: params.client_id,
          cuit: params.cuit,
          name: params.name.substring(0, 41),
          currency: params.currency || 'ARS',
        },
      });

      if (result.code) {
        throw result;
      }

      return result;
    } catch (error: any) {
      this.logger.error('BIND createCvu error', error);
      throw error;
    }
  }

  async getAccounts(): Promise<any> {
    if (!this.config.enable) {
      throw new Error('Bind not available');
    }

    if (!this.config.bankId) {
      throw new Error('Missing bankId. Invalid config');
    }

    try {
      const result = await this.request({
        method: 'GET',
        action: `/v1/banks/${this.config.bankId}/accounts/owner`,
      });

      if (result.code) {
        throw result;
      }

      return result;
    } catch (error: any) {
      this.logger.error('BIND getAccounts error', error);
      throw error;
    }
  }

  async getAccountByCbuCvu(params: { cbu_cvu: string }): Promise<any> {
    if (!this.config.enable) {
      throw new Error('Bind not available');
    }

    if (!params.cbu_cvu) {
      throw new Error('Missing cbu_cvu. Invalid parameters');
    }

    try {
      const result = await this.request({
        method: 'GET',
        action: `/v1/accounts/${params.cbu_cvu}`,
      });

      return result;
    } catch (error: any) {
      this.logger.error('BIND getAccountByCbuCvu error', error);
      throw error;
    }
  }
}
