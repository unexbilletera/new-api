import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';
import fetch, { Response } from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';

interface CronosConfig {
  enable: boolean;
  logging: boolean;
  proxy: boolean;
  apiUrl: string;
  username: string;
  password: string;
  userPassword: string;
  webhookSecret: string;
}

interface AppAuth {
  token: string;
  time: number;
}

interface UserAuth {
  [document: string]: {
    token: string;
    time: number;
  };
}

@Injectable()
export class CronosService implements OnModuleInit {
  private config: CronosConfig;
  private appAuth: AppAuth | null = null;
  private userAuth: UserAuth = {};
  private fetchAgent: SocksProxyAgent | null = null;

  private fetchWithProxy(
    url: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    },
  ): Promise<Response> {
    const fetchOptions: {
      method: string;
      headers: Record<string, string>;
      body?: string;
      agent?: SocksProxyAgent;
    } = {
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    if (options.body) {
      fetchOptions.body = options.body;
    }

    if (this.fetchAgent) {
      fetchOptions.agent = this.fetchAgent;
    }

    return fetch(url, fetchOptions);
  }

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    const apiUrl =
      this.configService.get('WALLET_CRONOS_URL') ||
      process.env.WALLET_CRONOS_URL ||
      '';

    this.config = {
      enable: this.configService.get('WALLET_CRONOS') === 'enable',
      logging: this.configService.get('WALLET_CRONOS_LOG') === 'enable',
      proxy: this.configService.get('WALLET_CRONOS_PROXY') === 'enable',
      apiUrl,
      username:
        this.configService.get('WALLET_CRONOS_USERNAME') ||
        process.env.WALLET_CRONOS_USERNAME ||
        '',
      password:
        this.configService.get('WALLET_CRONOS_PASSWORD') ||
        process.env.WALLET_CRONOS_PASSWORD ||
        '',
      userPassword:
        this.configService.get('WALLET_CRONOS_USER_PASSWORD') ||
        process.env.WALLET_CRONOS_USER_PASSWORD ||
        '',
      webhookSecret:
        this.configService.get('WALLET_CRONOS_WEBHOOK_SECRET') ||
        process.env.WALLET_CRONOS_WEBHOOK_SECRET ||
        '',
    };

    if (this.config.logging) {
      this.logger.info(
        '[CronosService]',
        `Configuration initialized - NODE_ENV: ${process.env.NODE_ENV || 'not set'}, URL: ${apiUrl || 'NOT CONFIGURED'}, Enable: ${this.config.enable}`,
      );
    }

    if (!this.config.enable) {
      this.logger.warn(
        '[CronosService] WARNING',
        'Cronos is disabled. Set WALLET_CRONOS=enable',
      );
    }

    if (!apiUrl) {
      this.logger.error(
        '[CronosService] ERROR',
        'WALLET_CRONOS_URL not configured!',
      );
    } else if (apiUrl.includes('stage')) {
      this.logger.warn(
        '[CronosService] WARNING',
        `WARNING: Using SANDBOX URL (stage): ${apiUrl}`,
      );
    }

    const useProxy =
      this.config.proxy ||
      process.env.USE_SOCKS_PROXY === 'true' ||
      this.configService.get('USE_SOCKS_PROXY') === 'true';

    if (useProxy) {
      try {
        const proxyPort = process.env.SOCKS_PROXY_PORT || '8080';
        const proxyUrl = `socks5h://localhost:${proxyPort}`;
        this.fetchAgent = new SocksProxyAgent(proxyUrl);

        this.logger.warn(
          '[CronosService] WARNING',
          `SOCKS proxy enabled - localhost:${proxyPort} (same as old API)`,
        );
      } catch (error) {
        this.logger.error(
          '[CronosService] ERROR',
          `Failed to configure SOCKS proxy: ${error instanceof Error ? error.message : String(error)}`,
        );

        this.fetchAgent = null;
      }
    }
  }

  
  private async getAppToken(): Promise<string> {
    try {

      if (
        this.appAuth &&
        this.appAuth.token &&
        Date.now() - this.appAuth.time < 1000 * 60 * 60
      ) {
        return this.appAuth.token;
      }

      if (
        !this.config.apiUrl ||
        !this.config.username ||
        !this.config.password
      ) {
        throw new Error('Cronos API credentials not configured');
      }

      const basicAuth = Buffer.from(
        `${this.config.username}:${this.config.password}`,
      ).toString('base64');

      const response: Response = await this.fetchWithProxy(
        `${this.config.apiUrl}/api/v1/application/token`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${basicAuth}`,
          },
        },
      );

      const responseText: string = await response.text();

      if (!response.ok) {
        this.logger.error(
          '[CronosService] ERROR',
          `Error getting application token: ${response.status} - ${responseText}`,
        );
        throw new Error(
          `Cronos API error: ${response.status} - ${responseText}`,
        );
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(responseText) as unknown;
      } catch (parseError) {
        const parseErrorMessage =
          parseError instanceof Error ? parseError.message : String(parseError);
        this.logger.error(
          '[CronosService] ERROR',
          `Error parsing application token response: ${parseErrorMessage}`,
        );
        throw new Error(
          `Invalid JSON response from Cronos API: ${responseText.substring(
            0,
            200,
          )}`,
        );
      }

      const result = parsed as { token?: string };

      if (!result || !result.token) {
        this.logger.error(
          '[CronosService] ERROR',
          `Token not found in response: ${JSON.stringify(result)}`,
        );
        throw new Error('Invalid response from Cronos API - missing token');
      }

      this.appAuth = {
        token: result.token,
        time: Date.now(),
      };

      if (this.config.logging) {
        this.logger.success(
          '[CronosService] SUCCESS',
          'Application token obtained successfully',
        );
      }

      return result.token;
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        'Error obtaining application token',
        error,
      );
      throw error;
    }
  }

  
  private async getUserToken(document: string): Promise<string> {
    try {
      if (!document) {
        throw new Error('Missing document parameter');
      }

      if (
        this.userAuth[document] &&
        this.userAuth[document].token &&
        Date.now() - this.userAuth[document].time < 1000 * 60 * 60
      ) {
        return this.userAuth[document].token;
      }

      if (!this.config.userPassword) {
        throw new Error('Cronos userPassword not configured');
      }

      if (this.config.logging) {
        this.logger.info(
          '[CronosService]',
          `Logging in user to Cronos - document: ${document}, userPassword configured: ${this.config.userPassword ? 'YES' : 'NO'}`,
        );
      }

      const appToken = await this.getAppToken();

      const requestUrl = `${this.config.apiUrl}/api/v1/user/auth`;
      const requestBody = {
        document,
        password: this.config.userPassword,
      };

      if (this.config.logging) {
        this.logger.debug('[CronosService]', `POST ${requestUrl}`);
        this.logger.debug(
          '[CronosService]',
          `Request Body: ${JSON.stringify({ ...requestBody, password: '***' }, null, 2)}`,
        );
        this.logger.debug(
          '[CronosService]',
          `Headers: Authorization: Bearer ${appToken.substring(0, 20)}...`,
        );
      }

      const response: Response = await this.fetchWithProxy(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${appToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText: string = await response.text();

      if (this.config.logging) {
        this.logger.debug(
          '[CronosService]',
          `Response Status: ${response.status} ${response.statusText}`,
        );
        const headersObject: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headersObject[key] = value;
        });
        this.logger.debug(
          '[CronosService]',
          `Response Headers: ${JSON.stringify(headersObject)}`,
        );
        try {
          const responseJson = JSON.parse(responseText) as unknown;
          this.logger.debug(
            '[CronosService]',
            `Response Body: ${JSON.stringify(responseJson, null, 2)}`,
          );
        } catch {
          this.logger.debug(
            '[CronosService]',
            `Response Body (text): ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`,
          );
        }
      }

      if (!response.ok) {
        this.logger.error(
          '[CronosService] ERROR',
          `Error getting user token: ${response.status} - ${responseText}`,
        );
        throw new Error(
          `Cronos API error: ${response.status} - ${responseText}`,
        );
      }

      let result: { token?: string };
      try {
        const parsed = JSON.parse(responseText) as unknown;
        result = parsed as { token?: string };
      } catch (parseError) {
        this.logger.error(
          '[CronosService] ERROR',
          `Error parsing response: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        );
        this.logger.error(
          '[CronosService] ERROR',
          `Response Text: ${responseText.substring(0, 500)}`,
        );
        throw new Error(
          `Invalid JSON response from Cronos API: ${responseText.substring(0, 200)}`,
        );
      }

      if (!result || !result.token) {
        this.logger.error(
          '[CronosService] ERROR',
          `Token not found in response: ${JSON.stringify(result)}`,
        );
        throw new Error('Invalid response from Cronos API - missing token');
      }

      if (!this.userAuth) {
        this.userAuth = {};
      }
      this.userAuth[document] = {
        token: result.token,
        time: Date.now(),
      };

      if (this.config.logging) {
        this.logger.success(
          '[CronosService] SUCCESS',
          `User token obtained successfully for document: ${document}`,
        );
      }

      return result.token;
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        `Error obtaining user token for document: ${document}`,
        error,
      );
      throw error;
    }
  }

  
  private async request(params: {
    method: string;
    action: string;
    body?: any;
    useUserAuth?: boolean;
    document?: string;
  }): Promise<any> {
    try {
      if (!this.config.enable) {
        throw new Error('Cronos not available');
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

      if (params.useUserAuth && !params.document) {
        throw new Error('Missing document. Invalid parameters');
      }

      const token = params.useUserAuth
        ? await this.getUserToken(params.document!)
        : await this.getAppToken();

      if (!token) {
        throw new Error('Invalid authorization token');
      }

      const requestUrl = `${this.config.apiUrl}${params.action}`;
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      const requestBody = params.body ? JSON.stringify(params.body) : undefined;

      if (this.config.logging) {
        this.logger.info(
          '[CronosService]',
          '═══════════════════════════════════════════════════════',
        );
        this.logger.info(
          '[CronosService]',
          `📤 REQUEST: ${params.method} ${requestUrl}`,
        );
        this.logger.info(
          '[CronosService]',
          '───────────────────────────────────────────────────────',
        );
        this.logger.debug(
          '[CronosService]',
          `Token Type: ${params.useUserAuth ? 'USER_TOKEN (Cronos)' : 'APP_TOKEN (Cronos)'}`,
        );
        if (params.useUserAuth && params.document) {
          this.logger.debug(
            '[CronosService]',
            `User Document: ${params.document} | Token Cached: ${this.userAuth && this.userAuth[params.document] ? 'YES' : 'NO'}`,
          );
        }
        this.logger.debug(
          '[CronosService]',
          `Authorization: Bearer ${token.substring(0, 30)}...${token.substring(token.length - 10)}`,
        );
        this.logger.debug(
          '[CronosService]',
          `Headers:\n${JSON.stringify(requestHeaders, null, 2)}`,
        );
        if (requestBody) {
          this.logger.debug(
            '[CronosService]',
            `Request Body:\n${JSON.stringify(params.body, null, 2)}`,
          );
        } else {
          this.logger.debug('[CronosService]', 'Request Body: (empty)');
        }
        this.logger.info(
          '[CronosService]',
          '───────────────────────────────────────────────────────',
        );
      }

      let response: Response = await this.fetchWithProxy(requestUrl, {
        method: params.method,
        headers: requestHeaders,
        body: requestBody,
      });

      let responseText: string = await response.text();

      if (this.config.logging) {
        this.logger.info(
          '[CronosService]',
          `📥 RESPOSTA: ${response.status} ${response.statusText}`,
        );
        this.logger.info(
          '[CronosService]',
          '───────────────────────────────────────────────────────',
        );
        const headersObject: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headersObject[key] = value;
        });
        this.logger.debug(
          '[CronosService]',
          `Response Headers:\n${JSON.stringify(headersObject, null, 2)}`,
        );
        try {
          const responseJson = JSON.parse(responseText) as unknown;
          this.logger.debug(
            '[CronosService]',
            `Response Body:\n${JSON.stringify(responseJson, null, 2)}`,
          );
        } catch {
          this.logger.debug(
            '[CronosService]',
            `Response Body (text):\n${responseText.substring(0, 1000)}${
              responseText.length > 1000 ? '\n... (truncated)' : ''
            }`,
          );
        }
        this.logger.info(
          '[CronosService]',
          '═══════════════════════════════════════════════════════',
        );
      }

      if (
        responseText.trim().startsWith('<!DOCTYPE') ||
        responseText.trim().startsWith('<html')
      ) {
        this.logger.error(
          '[CronosService] CRITICAL ERROR',
          `API returned HTML instead of JSON - Status: ${response.status}`,
        );
        this.logger.error(
          '[CronosService] ERROR',
          `URL: ${params.method} ${this.config.apiUrl}${params.action}`,
        );
        const headersObject: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headersObject[key] = value;
        });
        this.logger.error(
          '[CronosService] ERROR',
          `Response Headers: ${JSON.stringify(headersObject)}`,
        );
        this.logger.error(
          '[CronosService] ERROR',
          `Response Body (first 2000 characters): ${responseText.substring(0, 2000)}`,
        );
        if (responseText.length > 2000) {
          this.logger.error(
            '[CronosService] ERROR',
            `... (total of ${responseText.length} characters)`,
          );
        }
        throw new Error(
          `Cronos API returned HTML instead of JSON. Status: ${response.status}. Check URL and authentication.`,
        );
      }

      let result: {
        success?: boolean;
        message?: unknown;
        [key: string]: unknown;
      };
      try {
        const parsed = JSON.parse(responseText) as unknown;
        result = parsed as {
          success?: boolean;
          message?: unknown;
          [key: string]: unknown;
        };
      } catch (parseError) {
        this.logger.error(
          '[CronosService] CRITICAL ERROR',
          `Error parsing JSON - Status: ${response.status}`,
        );
        this.logger.error(
          '[CronosService] ERROR',
          `Erro de parse: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        );
        this.logger.error(
          '[CronosService] ERROR',
          `URL: ${params.method} ${this.config.apiUrl}${params.action}`,
        );
        this.logger.error(
          '[CronosService] ERROR',
          `Response Body (first 2000 characters): ${responseText.substring(0, 2000)}`,
        );
        if (responseText.length > 2000) {
          this.logger.error(
            '[CronosService] ERROR',
            `... (total of ${responseText.length} characters)`,
          );
        }
        throw new Error(
          `Cronos API returned invalid response. Status: ${response.status}. Body: ${responseText.substring(0, 500)}`,
        );
      }

      if (
        (!response.ok || (result && result.success === false)) &&
        (response.status === 401 ||
          (result &&
            result.message &&
            typeof result.message === 'string' &&
            (result.message.includes('authorization') ||
              result.message.includes('authorization') ||
              result.message.includes('Sem authorization')))) &&
        params.useUserAuth &&
        params.document
      ) {
        this.logger.warn(
          '[CronosService] WARNING',
          `Authorization error detected. Clearing cache and regenerating user token for document: ${params.document}`,
        );

        if (this.userAuth && this.userAuth[params.document]) {
          delete this.userAuth[params.document];
        }

        const newToken = await this.getUserToken(params.document);

        if (this.config.logging) {
          this.logger.info(
            '[CronosService]',
            `Resending request with new user token...`,
          );
        }

        const retryResponse: Response = await this.fetchWithProxy(
          `${this.config.apiUrl}${params.action}`,
          {
            method: params.method,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${newToken}`,
            },
            body: params.body ? JSON.stringify(params.body) : undefined,
          },
        );

        const retryResponseText: string = await retryResponse.text();

        if (
          retryResponseText.trim().startsWith('<!DOCTYPE') ||
          retryResponseText.trim().startsWith('<html')
        ) {
          this.logger.error(
            '[CronosService] CRITICAL ERROR',
            `API returned HTML instead of JSON after retry - Status: ${retryResponse.status}`,
          );
          throw new Error(
            `Cronos API returned HTML instead of JSON after retry. Status: ${retryResponse.status}.`,
          );
        }

        try {
          const retryParsed = JSON.parse(retryResponseText) as unknown;
          result = retryParsed as {
            success?: boolean;
            message?: unknown;
            [key: string]: unknown;
          };
        } catch (parseError) {
          this.logger.error(
            '[CronosService] CRITICAL ERROR',
            `Error parsing JSON after retry: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          );
          throw new Error(
            `Cronos API returned invalid response after retry. Status: ${retryResponse.status}.`,
          );
        }

        response = retryResponse;
        responseText = retryResponseText;
      }

      if (!response.ok || (result && result.success === false)) {
        this.logger.error(
          '[CronosService] ERROR',
          `Erro na resposta: ${response.status} - ${JSON.stringify(result, null, 2)}`,
        );
        this.logger.error(
          '[CronosService] ERROR',
          `URL: ${params.method} ${this.config.apiUrl}${params.action}`,
        );
        this.logger.error(
          '[CronosService] ERROR',
          `Request Body: ${JSON.stringify(params.body || {}, null, 2)}`,
        );
        throw new Error(
          `Cronos API error: ${response.status} - ${JSON.stringify(result, null, 2)}`,
        );
      }

      if (this.config.logging) {
        this.logger.success(
          '[CronosService] SUCCESS',
          `Resposta recebida: ${JSON.stringify(result)}`,
        );
      }

      return result;
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        'Error making request to Cronos API',
        error,
      );
      throw error;
    }
  }

  
  async transferPix(params: {
    document: string;
    keyType: string;
    keyValue: string;
  }): Promise<{
    id_pagamento: string;
    recebedor: {
      pessoa: {
        nome: string;
        tipoDocumento: string;
        documento: string;
      };
      conta: {
        banco: string;
        bancoNome: string;
        agencia: string;
        numero: string;
      };
    };
  }> {
    try {
      if (!params.document) {
        throw new Error('Missing document. Invalid parameters');
      }
      if (!params.keyType) {
        throw new Error('Missing keyType. Invalid parameters');
      }
      if (!params.keyValue) {
        throw new Error('Missing keyValue. Invalid parameters');
      }

      const cronosKeyType = this.mapKeyTypeToCronos(params.keyType);

      if (this.config.logging) {
        this.logger.info(
          '[CronosService]',
          `Creating PIX transfer - document: ${params.document}, keyType: ${params.keyType}, keyValue: ${params.keyValue}`,
        );
      }

      let result: {
        id_pagamento?: string;
        recebedor?: {
          pessoa?: {
            nome: string;
            tipoDocumento: string;
            documento: string;
          };
          conta?: {
            banco: string;
            bancoNome: string;
            agencia: string;
            numero: string;
          };
        };
      };

      try {
        result = (await this.request({
          method: 'POST',
          action: '/api/v1/pix/criartransferencia',
          document: params.document,
          useUserAuth: true,
          body: {
            key_type: cronosKeyType,
            key_value: params.keyValue,
          },
        })) as typeof result;

        if (this.config.logging) {
          this.logger.success(
            '[CronosService] SUCCESS',
            'PIX transfer created using user token',
          );
        }
      } catch (userAuthError) {

        if (this.config.logging) {
          this.logger.warn(
            '[CronosService] WARNING',
            `Failed to use user token, trying with application token: ${userAuthError instanceof Error ? userAuthError.message : String(userAuthError)}`,
          );
        }

        result = (await this.request({
          method: 'POST',
          action: '/api/v1/pix/criartransferencia',
          useUserAuth: false,
          body: {
            key_type: cronosKeyType,
            key_value: params.keyValue,
            document: params.document,
          },
        })) as typeof result;

        if (this.config.logging) {
          this.logger.success(
            '[CronosService] SUCCESS',
            'PIX Transfer criada usando token da aplicação',
          );
        }
      }

      if (
        !result ||
        !result.id_pagamento ||
        !result.recebedor ||
        !result.recebedor.pessoa ||
        !result.recebedor.conta
      ) {
        throw new Error('Invalid response from Cronos API');
      }

      return {
        id_pagamento: result.id_pagamento,
        recebedor: {
          pessoa: {
            nome: result.recebedor.pessoa.nome,
            tipoDocumento: result.recebedor.pessoa.tipoDocumento,
            documento: result.recebedor.pessoa.documento,
          },
          conta: {
            banco: result.recebedor.conta.banco,
            bancoNome: result.recebedor.conta.bancoNome,
            agencia: result.recebedor.conta.agencia,
            numero: result.recebedor.conta.numero,
          },
        },
      };
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        'Error creating PIX transfer',
        error,
      );
      throw error;
    }
  }

  
  async confirmTransferPix(params: {
    document: string;
    id: string;
    amount: number;
    description?: string;
  }): Promise<any> {
    try {
      if (!params.document) {
        throw new Error('Missing document. Invalid parameters');
      }
      if (!params.id) {
        throw new Error('Missing id. Invalid parameters');
      }
      if (!params.amount) {
        throw new Error('Missing amount. Invalid parameters');
      }

      if (this.config.logging) {
        this.logger.info(
          '[CronosService]',
          `Confirming PIX transfer - document: ${params.document}, id_pagamento: ${params.id}, amount: ${params.amount}`,
        );
      }

      const result = (await this.request({
        method: 'POST',
        action: '/api/v1/pix/confirmartransferencia',
        document: params.document,
        useUserAuth: true,
        body: {
          id_pagamento: params.id,
          valor: params.amount,
          description: params.description || '',
          save_as_favorite: 0,
        },
      })) as unknown;

      if (this.config.logging) {
        this.logger.success(
          '[CronosService] SUCCESS',
          'PIX transfer confirmed successfully in Cronos API',
        );
      }

      return result;
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        'Error confirming PIX transfer',
        error,
      );
      throw error;
    }
  }

  
  async createTransactionalToken(params: {
    document: string;
    amount: number;
    lat?: number;
    lon?: number;
  }): Promise<any> {
    try {
      if (!params.document) {
        throw new Error('Missing document. Invalid parameters');
      }
      if (!params.amount) {
        throw new Error('Missing amount. Invalid parameters');
      }

      if (this.config.logging) {
        this.logger.info(
          '[CronosService]',
          `Creating transactional token - document: ${params.document}, amount: ${params.amount}, lat: ${params.lat || 0}, lon: ${params.lon || 0}`,
        );
      }

      const result = await this.request({
        method: 'POST',
        action: '/api/v1/transactions/requesttoken',
        document: params.document,
        useUserAuth: true,
        body: {
          amount: params.amount,
          lat: params.lat || 0,
          lon: params.lon || 0,
        },
      });

      if (this.config.logging) {
        this.logger.success(
          '[CronosService] SUCCESS',
          'Transactional token created successfully in Cronos API',
        );
      }

      return result;
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        'Error creating transactional token in Cronos API',
        error,
      );
      throw error;
    }
  }

  
  async confirmTransactionPassword(params: { document: string }): Promise<any> {
    try {
      if (!params.document) {
        throw new Error('Missing document. Invalid parameters');
      }

      if (!this.config.userPassword) {
        throw new Error('Cronos userPassword not configured');
      }

      if (this.config.logging) {
        this.logger.info(
          '[CronosService]',
          `Confirming transactional password in Cronos - document: ${params.document}`,
        );
      }

      const result = await this.request({
        method: 'POST',
        action: '/api/v1/transactions/pass',
        document: params.document,
        useUserAuth: true,
        body: {
          password: this.config.userPassword,
        },
      });

      if (this.config.logging) {
        this.logger.success(
          '[CronosService] SUCCESS',
          'Transactional password confirmed successfully in Cronos API',
        );
      }

      return result;
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        'Error confirming transactional password in Cronos API',
        error,
      );
      throw error;
    }
  }

  
  async getAccountBalance(params: {
    document: string;
  }): Promise<{ amount?: number; balance?: number; saldo?: number }> {
    try {
      if (!params.document) {
        throw new Error('Missing document. Invalid parameters');
      }

      if (this.config.logging) {
        this.logger.info(
          '[CronosService]',
          `Fetching account balance - document: ${params.document}`,
        );
      }

      const result = (await this.request({
        method: 'GET',
        action: '/api/v1/account/balance',
        document: params.document,
        useUserAuth: true,
      })) as { amount?: number; balance?: number; saldo?: number };

      if (this.config.logging) {
        this.logger.success(
          '[CronosService] SUCCESS',
          'Account balance obtained successfully from Cronos API',
        );
      }

      return result;
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        'Error obtaining account balance from Cronos API',
        error,
      );
      throw error;
    }
  }

  
  async getTransactions(params: {
    document: string;
    startDate?: string;
    endDate?: string;
    searchtext?: string;
    type_transaction?: string;
    limit?: string;
  }): Promise<any> {
    try {
      if (!params.document) {
        throw new Error('Missing document. Invalid parameters');
      }

      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.searchtext)
        queryParams.append('searchtext', params.searchtext);
      if (params.type_transaction)
        queryParams.append('type_transaction', params.type_transaction);
      if (params.limit) queryParams.append('limit', params.limit);

      const action = `/api/v1/statements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      if (this.config.logging) {
        this.logger.info(
          '[CronosService]',
          `Fetching transactions - document: ${params.document}`,
        );
      }

      const result = await this.request({
        method: 'GET',
        action,
        document: params.document,
        useUserAuth: true,
      });

      if (this.config.logging) {
        this.logger.success(
          '[CronosService] SUCCESS',
          'Transactions obtained successfully from Cronos API',
        );
      }

      return result;
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        'Error obtaining transactions from Cronos API',
        error,
      );
      throw error;
    }
  }

  
  async syncCronosBalance(params: {
    userId: string;
    userIdentities: Array<{
      country: string;
      status: string;
      taxDocumentNumber: string;
    }>;
    userAccounts: Array<{
      id: string;
      type: string;
      status: string;
      balance: string;
    }>;
  }): Promise<void> {
    try {
      if (!params || !params.userId) {
        throw new Error('Missing userId for balance sync');
      }

      this.logger.info(
        '[CronosService] 🔄',
        `Starting balance sync for user: ${params.userId}`,
      );

      const brIdentity = params.userIdentities?.find(
        (id) => id.country === 'br' && id.status === 'enable',
      );

      if (!brIdentity) {
        this.logger.warn(
          '[CronosService] WARNING',
          'User does not have an active BR identity',
        );
        return;
      }

      const cronosAccount = params.userAccounts?.find(
        (acc) => acc.type === 'cronos' && acc.status === 'enable',
      );

      if (!cronosAccount) {
        this.logger.warn(
          '[CronosService] WARNING',
          'User does not have an active Cronos account',
        );
        return;
      }

      const unexBalance = parseFloat(cronosAccount.balance || '0');

      this.logger.info('[CronosService] 💰', 'Unex Balance (Cronos):', {
        accountId: cronosAccount.id,
        balance: unexBalance,
        document: brIdentity.taxDocumentNumber,
      });

      let cronosBalance: number | null = null;
      try {
        const cronosResponse = await this.getAccountBalance({
          document: brIdentity.taxDocumentNumber,
        });
        cronosBalance =
          parseFloat(
            String(
              cronosResponse?.amount ||
                cronosResponse?.balance ||
                cronosResponse?.saldo ||
                0,
            ),
          ) || 0;

        this.logger.info('[CronosService] 💰', 'Cronos Balance (API):', {
          balance: cronosBalance,
          document: brIdentity.taxDocumentNumber,
        });
      } catch (cronosError: any) {
        this.logger.error(
          '[CronosService] ERROR',
          `Error querying Cronos balance: ${cronosError?.message || String(cronosError)}`,
        );
        return;
      }

      const difference = Math.abs(unexBalance - cronosBalance);
      const tolerance = 0.01;

      if (difference > tolerance) {
        this.logger.warn('[CronosService] WARNING', 'DISCREPANCY DETECTED:', {
          unexBalance,
          cronosBalance,
          difference,
          discrepancyPercentage: `${(
            (difference / Math.max(unexBalance, cronosBalance)) *
            100
          ).toFixed(2)}%`,
        });

        if (cronosBalance === 0 && unexBalance > 0) {
          this.logger.info(
            '[CronosService] 🔍',
            'Verificando statements recentes para reconciliar...',
          );

          try {
            const endDate = new Date()
              .toISOString()
              .slice(0, 19)
              .replace('T', ' ');
            const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 19)
              .replace('T', ' ');

            const statements = await this.getTransactions({
              document: brIdentity.taxDocumentNumber,
              startDate,
              endDate,
              limit: '100',
            });

            this.logger.info(
              '[CronosService] 📋',
              'Statements recentes encontrados:',
              {
                count: (statements?.statements || []).length,
                startDate,
                endDate,
              },
            );

            const pendingCashins = await this.prisma.transactions.findMany({
              where: {
                type: 'cashin_cronos',
                status: 'pending',
                sourceUserId: params.userId,
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            });

            if (pendingCashins?.length > 0) {
              this.logger.warn(
                '[CronosService] WARNING',
                `Encontrados ${pendingCashins.length} cashin_cronos pendentes:`,
                {
                  transactions: pendingCashins.map((tx) => ({
                    id: tx.id,
                    amount: tx.amount,
                    createdAt: tx.createdAt,
                    status: tx.status,
                  })),
                },
              );
            }

            const pendingExchanges = await this.prisma.ramp_operations.findMany(
              {
                where: {
                  user_id: params.userId,
                  status: {
                    in: ['STARTING', 'WAITING_DEPOSIT', 'ORDER_EXECUTED'],
                  },
                  created_at: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  },
                },
              },
            );

            if (pendingExchanges?.length > 0) {
              this.logger.warn(
                '[CronosService] WARNING',
                `Found ${pendingExchanges.length} pending exchange operations:`,
                {
                  operations: pendingExchanges.map((op) => ({
                    id: op.id,
                    direction: op.direction,
                    status: op.status,
                    depositAmount: op.deposit_amount,
                    createdAt: op.created_at,
                  })),
                },
              );
            }
          } catch (stmtError: any) {
            this.logger.error(
              '[CronosService] WARNING',
              `Erro ao verificar statements: ${stmtError?.message || String(stmtError)}`,
            );
          }
        }
      } else {
        this.logger.success('[CronosService] SUCCESS', 'Balances synchronized:', {
          unexBalance,
          cronosBalance,
          difference,
        });
      }

      if (Math.abs(difference) > 0.01) {
        try {
          this.logger.info('[CronosService] 🔧', 'Starting balance adjustment');
          const balanceBefore = cronosAccount.balance;

          await this.prisma.usersAccounts.update({
            where: { id: cronosAccount.id },
            data: { balance: cronosBalance },
          });

          this.logger.success(
            '[CronosService] 💾',
            'BRL balance adjusted successfully:',
            {
              accountId: cronosAccount.id,
              userId: params.userId,
              balanceBefore,
              balanceAfter: cronosBalance,
              difference: parseFloat(balanceBefore || '0') - cronosBalance,
            },
          );
        } catch (adjustError: any) {
          this.logger.error(
            '[CronosService] ERROR',
            `Error adjusting balance: ${adjustError?.message || String(adjustError)}`,
          );
        }
      }
    } catch (error: any) {
      this.logger.error(
        '[CronosService] ERROR',
        `General synchronization error: ${error?.message || String(error)}`,
      );

    }
  }

  
  private mapKeyTypeToCronos(keyType: string): string {
    const mapping: Record<string, string> = {
      cpf: 'cpf',
      cnpj: 'cnpj',
      email: 'email',
      phone: 'phone',
      evp: 'evp',
    };

    return mapping[keyType.toLowerCase()] || keyType.toLowerCase();
  }

  async onboardingStart(params: { document: string }): Promise<{ individual_id: string }> {
    try {
      if (!params || !params.document) {
        throw new Error('Missing document. Invalid parameters');
      }

      const result = (await this.request({
        method: 'POST',
        action: '/api/v1/register/individual',
        body: {
          document: params.document,
        },
      })) as { individual_id: string };

      return result;
    } catch (error) {
      this.logger.errorWithStack('[CronosService] ERROR', 'onboardingStart error', error);
      throw error;
    }
  }

  async onboardingStep1(params: {
    cronosId: string;
    name: string;
    email: string;
  }): Promise<any> {
    try {
      if (!params || !params.cronosId) {
        throw new Error('Missing cronosId. Invalid parameters');
      }
      if (!params || !params.name) {
        throw new Error('Missing name. Invalid parameters');
      }
      if (!params || !params.email) {
        throw new Error('Missing email. Invalid parameters');
      }

      const result = await this.request({
        method: 'POST',
        action: '/api/v1/register/individual/step1',
        body: {
          individual_id: params.cronosId,
          full_name: params.name,
          email: params.email,
        },
      });

      return result;
    } catch (error) {
      this.logger.errorWithStack('[CronosService] ERROR', 'onboardingStep1 error', error);
      throw error;
    }
  }

  async onboardingStep2(params: {
    cronosId: string;
    phonePrefix: string;
    phoneNumber: string;
    code?: string;
  }): Promise<any> {
    try {
      if (!params || !params.cronosId) {
        throw new Error('Missing cronosId. Invalid parameters');
      }
      if (!params || !params.phonePrefix) {
        throw new Error('Missing phonePrefix. Invalid parameters');
      }
      if (!params || !params.phoneNumber) {
        throw new Error('Missing phoneNumber. Invalid parameters');
      }

      const result = await this.request({
        method: params.code ? 'PUT' : 'POST',
        action: '/api/v1/register/individual/step2',
        body: {
          individual_id: params.cronosId,
          phone_prefix: params.phonePrefix,
          phone_number: params.phoneNumber,
          code: params.code,
        },
      });

      return result;
    } catch (error) {
      this.logger.errorWithStack('[CronosService] ERROR', 'onboardingStep2 error', error);
      throw error;
    }
  }

  async onboardingStep3(params: {
    cronosId: string;
    documentType: string;
    documentFace: string;
    fileUrl: string;
  }): Promise<any> {
    try {
      if (!params || !params.cronosId) {
        throw new Error('Missing cronosId. Invalid parameters');
      }
      if (!params || !params.documentType) {
        throw new Error('Missing documentType. Invalid parameters');
      }
      if (!params || !params.documentFace) {
        throw new Error('Missing documentFace. Invalid parameters');
      }
      if (!params || !params.fileUrl) {
        throw new Error('Missing fileUrl. Invalid parameters');
      }

      const fetch = (await import('node-fetch')).default;
      const fileStream = await fetch(params.fileUrl).then((res) => res.body);

      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('individual_id', params.cronosId);
      formData.append('image_type', params.documentType);
      formData.append('document_type', params.documentFace);
      formData.append('file', fileStream, {
        filename: `${params.cronosId}_${params.documentType}_${params.documentFace}`,
      });

      const result = await this.request({
        method: 'POST',
        action: '/api/v1/register/individual/step3',
        body: formData as any,
      });

      return result;
    } catch (error) {
      this.logger.errorWithStack('[CronosService] ERROR', 'onboardingStep3 error', error);
      throw error;
    }
  }

  async onboardingStep4(params: {
    cronosId: string;
    documentType?: string;
    documentNumber?: string;
    documentState?: string;
    documentIssuance?: string;
    documentIssuanceDate?: string;
    gender?: string;
    birthDate?: string;
    maritalStatus?: string;
    nationality?: string;
    nationalityState?: string;
    motherName?: string;
    fatherName?: string;
    pep?: string;
    pepSince?: string;
    monthlyIncome?: string;
  }): Promise<any> {
    try {
      if (!params || !params.cronosId) {
        throw new Error('Missing cronosId. Invalid parameters');
      }

      const cronosGender: Record<string, string> = {
        male: 'M',
        female: 'F',
      };

      const cronosMaritalStatus: Record<string, number> = {
        single: 0,
        married: 1,
        divorced: 2,
        widowed: 3,
        cohabiting: 4,
        separated: 5,
      };

      const body: any = {
        individual_id: params.cronosId,
      };

      if (params.documentType) {
        body.document_name = params.documentType.toString().trim().toUpperCase();
      }
      if (params.documentNumber) body.document_number = params.documentNumber;
      if (params.documentState) body.document_state = params.documentState;
      if (params.documentIssuance) body.document_issuance = params.documentIssuance;
      if (params.documentIssuanceDate) body.issuance_date = params.documentIssuanceDate;
      if (params.gender) {
        body.gender = cronosGender[params.gender.toLowerCase()] || params.gender;
      }
      if (params.birthDate) body.birth_date = params.birthDate;
      if (params.maritalStatus) {
        body.marital_status =
          cronosMaritalStatus[params.maritalStatus.toLowerCase()] ?? params.maritalStatus;
      }
      if (params.nationality) body.nationality = params.nationality;
      if (params.nationalityState) body.nationality_state = params.nationalityState;
      if (params.motherName) body.mother_name = params.motherName;
      if (params.fatherName) body.father_name = params.fatherName;
      if (params.pep !== undefined) body.pep = params.pep;
      if (params.pepSince) body.pep_since = params.pepSince;
      if (params.monthlyIncome) body.renda_mensal = params.monthlyIncome;

      const result = await this.request({
        method: 'POST',
        action: '/api/v1/register/individual/step4',
        body,
      });

      return result;
    } catch (error) {
      this.logger.errorWithStack('[CronosService] ERROR', 'onboardingStep4 error', error);
      throw error;
    }
  }

  async onboardingStep5(params: { cronosId: string; fileUrl: string }): Promise<any> {
    try {
      if (!params || !params.cronosId) {
        throw new Error('Missing cronosId. Invalid parameters');
      }
      if (!params || !params.fileUrl) {
        throw new Error('Missing fileUrl. Invalid parameters');
      }

      const fetch = (await import('node-fetch')).default;
      const fileStream = await fetch(params.fileUrl).then((res) => res.body);

      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('individual_id', params.cronosId);
      formData.append('image_type', 'foto_selfie');
      formData.append('file', fileStream, {
        filename: `${params.cronosId}_selfie`,
      });

      const result = await this.request({
        method: 'POST',
        action: '/api/v1/register/individual/step5',
        body: formData as any,
      });

      return result;
    } catch (error) {
      this.logger.errorWithStack('[CronosService] ERROR', 'onboardingStep5 error', error);
      throw error;
    }
  }

  async onboardingStep6(params: {
    cronosId: string;
    zipCode: string;
    addressTypeId?: string;
    street: string;
    number: string;
    neighborhood: string;
    state: string;
    city: string;
    country: string;
    complement?: string;
  }): Promise<any> {
    try {
      if (!params || !params.cronosId) {
        throw new Error('Missing cronosId. Invalid parameters');
      }
      if (!params || !params.zipCode) {
        throw new Error('Missing zipCode. Invalid parameters');
      }
      if (!params || !params.street) {
        throw new Error('Missing street. Invalid parameters');
      }
      if (!params || !params.number) {
        throw new Error('Missing number. Invalid parameters');
      }
      if (!params || !params.neighborhood) {
        throw new Error('Missing neighborhood. Invalid parameters');
      }
      if (!params || !params.state) {
        throw new Error('Missing state. Invalid parameters');
      }
      if (!params || !params.city) {
        throw new Error('Missing city. Invalid parameters');
      }
      if (!params || !params.country) {
        throw new Error('Missing country. Invalid parameters');
      }

      const cronosAddressType: Record<string, number> = {
        own: 1,
        rent: 2,
        financed: 3,
        company: 4,
        parents: 5,
      };

      const result = await this.request({
        method: 'POST',
        action: '/api/v1/register/individual/step6',
        body: {
          individual_id: params.cronosId,
          postal_code: params.zipCode,
          address_type_id: cronosAddressType[params.addressTypeId || 'own'] || 1,
          street: params.street,
          number: params.number,
          neighborhood: params.neighborhood,
          state: params.state,
          city: params.city,
          country: params.country,
          complement: params.complement,
        },
      });

      return result;
    } catch (error) {
      this.logger.errorWithStack('[CronosService] ERROR', 'onboardingStep6 error', error);
      throw error;
    }
  }

  async onboardingStep7(params: { cronosId: string }): Promise<any> {
    try {
      if (!params || !params.cronosId) {
        throw new Error('Missing cronosId. Invalid parameters');
      }

      const result = await this.request({
        method: 'POST',
        action: '/api/v1/register/individual/step7',
        body: {
          individual_id: params.cronosId,
          password: this.config.userPassword,
          confirm_password: this.config.userPassword,
        },
      });

      return result;
    } catch (error) {
      this.logger.errorWithStack('[CronosService] ERROR', 'onboardingStep7 error', error);
      throw error;
    }
  }

  async getOnboardingStatus(params: { cronosId: string }): Promise<any> {
    try {
      if (!params || !params.cronosId) {
        throw new Error('Missing cronosId. Invalid parameters');
      }

      const result = await this.request({
        method: 'GET',
        action: `/api/v1/register/individual/${params.cronosId}`,
      });

      return result;
    } catch (error) {
      this.logger.errorWithStack('[CronosService] ERROR', 'getOnboardingStatus error', error);
      throw error;
    }
  }

  async getAccount(params: { document: string }): Promise<any> {
    try {
      if (!params || !params.document) {
        throw new Error('Missing document. Invalid parameters');
      }

      const result = await this.request({
        method: 'GET',
        action: '/api/v1/account/',
        document: params.document,
        useUserAuth: true,
      });

      return result;
    } catch (error) {
      this.logger.errorWithStack('[CronosService] ERROR', 'getAccount error', error);
      throw error;
    }
  }

  async getPixKeys(params: { document: string }): Promise<any> {
    try {
      if (!params || !params.document) {
        throw new Error('Missing document. Invalid parameters');
      }

      const result = await this.request({
        method: 'GET',
        action: '/api/v1/pix/chaves',
        document: params.document,
        useUserAuth: true,
      });

      return result;
    } catch (error) {
      this.logger.errorWithStack('[CronosService] ERROR', 'getPixKeys error', error);
      throw error;
    }
  }

  async getAlias(params: { document: string }): Promise<any> {
    try {
      if (!params || !params.document) {
        throw new Error('Missing document. Invalid parameters');
      }

      const pixKeys = await this.getPixKeys(params);

      const result: any = {};
      const chaves = pixKeys?.chaves || [];

      const cpf = chaves.find((key: any) => key.chave_tipo === 'cpf');
      const cnpj = chaves.find((key: any) => key.chave_tipo === 'cnpj');
      const email = chaves.find((key: any) => key.chave_tipo === 'email');
      const telefone = chaves.find((key: any) => key.chave_tipo === 'telefone');
      const evp = chaves.find((key: any) => key.chave_tipo === 'evp');

      if (cpf) result.cpf = cpf.chave;
      if (cnpj) result.cnpj = cnpj.chave;
      if (email) result.email = email.chave;
      if (telefone) result.telefone = telefone.chave;
      if (evp) result.evp = evp.chave;

      return result;
    } catch (error) {
      this.logger.errorWithStack('[CronosService] ERROR', 'getAlias error', error);
      return {};
    }
  }

  async addPixKey(params: { document: string; type: string; key: string }): Promise<any> {
    try {
      if (!params || !params.document) {
        throw new Error('Missing document. Invalid parameters');
      }
      if (!params || !params.type) {
        throw new Error('Missing type. Invalid parameters');
      }
      if (!params || !params.key) {
        throw new Error('Missing key. Invalid parameters');
      }

      const result = await this.request({
        method: 'POST',
        action: '/api/v1/pix/chaves/cadastrar',
        document: params.document,
        useUserAuth: true,
        body: {
          tipo_chave: params.type,
          chave: params.key,
        },
      });

      return result;
    } catch (error) {
      this.logger.errorWithStack('[CronosService] ERROR', 'addPixKey error', error);
      throw error;
    }
  }

  async onboarding(params: {
    cronosId: string;
    name: string;
    email: string;
    phone: string;
    motherName?: string;
    fatherName?: string;
    gender?: string;
    birthdate?: string;
    nationality?: string;
    nationalityState?: string;
    maritalStatus?: string;
    pep?: string;
    documentType?: string;
    documentNumber?: string;
    documentState?: string;
    documentIssuance?: string;
    documentIssuanceDate?: string;
    selfie?: string;
    zipCode?: string;
    addressTypeId?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    state?: string;
    city?: string;
    country?: string;
    complement?: string;
    rgFrente?: string;
    rgVerso?: string;
    cnhFrente?: string;
    cnhVerso?: string;
    rneFrente?: string;
    rneVerso?: string;
  }): Promise<any> {
    try {
      if (!params || !params.cronosId) {
        throw new Error('Missing cronosId. Invalid parameters');
      }

      const cronosGender: Record<string, string> = {
        male: 'M',
        female: 'F',
      };

      const cronosMaritalStatus: Record<string, number> = {
        single: 0,
        married: 1,
        divorced: 2,
        widowed: 3,
        cohabiting: 4,
        separated: 5,
      };

      const cronosAddressType: Record<string, number> = {
        own: 1,
        rent: 2,
        financed: 3,
        company: 4,
        parents: 5,
      };

      const toCronosDate = (value: any): string | undefined => {
        if (!value) return undefined;
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return undefined;
        return date.toISOString().slice(0, 10);
      };

      const toUpper = (value: any): string | undefined => {
        return value ? value.toString().trim().toUpperCase() || undefined : undefined;
      };

      const cleanPostalCode = (value: any): string | undefined => {
        if (!value) return undefined;
        return value.toString().trim().replace(/[^0-9A-Z]/gi, '');
      };

      const mapEnum = (value: any, mapping: Record<string, any>): any => {
        if (value === null || value === undefined) return undefined;
        if (typeof value === 'string') {
          const normalized = value.trim().toLowerCase();
          if (Object.prototype.hasOwnProperty.call(mapping, normalized)) {
            return mapping[normalized];
          }
        }
        return value;
      };

      const normalizedGender = (() => {
        if (!params.gender) return undefined;
        const genderValue = params.gender.toString().trim();
        const mapped = mapEnum(genderValue, cronosGender);
        if (mapped === 'M' || mapped === 'F') return mapped;
        if (/^m$/i.test(genderValue) || /^masculino$/i.test(genderValue)) return 'M';
        if (/^f$/i.test(genderValue) || /^feminino$/i.test(genderValue)) return 'F';
        return undefined;
      })();

      const payload: any = {
        name: params.name,
        email: params.email,
        phone: params.phone,
        rg_frente: params.rgFrente,
        rg_verso: params.rgVerso,
        cnh_frente: params.cnhFrente,
        cnh_verso: params.cnhVerso,
        rne_frente: params.rneFrente,
        rne_verso: params.rneVerso,
        mother_name: params.motherName,
        father_name: params.fatherName,
        gender: normalizedGender,
        birth_date: toCronosDate(params.birthdate),
        nationality: toUpper(params.nationality || params.country),
        nationality_state: toUpper(params.nationalityState),
        document_name: params.documentType ? params.documentType.toString().trim() : undefined,
        document_number: params.documentNumber,
        document_state: toUpper(params.documentState),
        document_issuance: params.documentIssuance
          ? params.documentIssuance.toString().trim().toUpperCase()
          : undefined,
        issuance_date: toCronosDate(params.documentIssuanceDate),
        marital_status: mapEnum(params.maritalStatus, cronosMaritalStatus),
        pep: params.pep === 'no' || params.pep === '0' || (typeof params.pep === 'number' && params.pep === 0) ? 0 : 1,
        selfie: params.selfie,
        postal_code: cleanPostalCode(params.zipCode),
        address_type_id: mapEnum(params.addressTypeId, cronosAddressType),
        street: params.street,
        number: params.number,
        neighborhood: params.neighborhood,
        state: toUpper(params.state),
        city: params.city,
        country: toUpper(params.country),
        complement: params.complement,
        password: this.config.userPassword,
      };

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
          delete payload[key];
        }
      });

      const result = await this.request({
        method: 'POST',
        action: `/api/v1/register/simplify/${params.cronosId}`,
        body: payload,
      });

      return result;
    } catch (error) {
      this.logger.errorWithStack('[CronosService] ERROR', 'onboarding error', error);
      throw error;
    }
  }
}
