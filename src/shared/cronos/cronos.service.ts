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
        `Configuração inicializada - NODE_ENV: ${process.env.NODE_ENV || 'not set'}, URL: ${apiUrl || 'NÃO CONFIGURADA'}, Enable: ${this.config.enable}`,
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
          `SOCKS proxy enabled - localhost:${proxyPort} (igual à API antiga)`,
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
          `Erro ao obter token da aplicação: ${response.status} - ${responseText}`,
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
          `Erro ao fazer parse da resposta do token da aplicação: ${parseErrorMessage}`,
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
          `Token não encontrado na resposta: ${JSON.stringify(result)}`,
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
          'Token da aplicação obtido com sucesso',
        );
      }

      return result.token;
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        'Erro ao obter token da aplicação',
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
          `Fazendo login do usuário na Cronos - document: ${document}, userPassword configurado: ${this.config.userPassword ? 'SIM' : 'NÃO'}`,
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
          `Erro ao obter token do usuário: ${response.status} - ${responseText}`,
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
          `Erro ao fazer parse da resposta: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
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
          `Token não encontrado na resposta: ${JSON.stringify(result)}`,
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
          `Token do usuário obtido com sucesso para documento: ${document}`,
        );
      }

      return result.token;
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        `Erro ao obter token do usuário para documento: ${document}`,
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
          `📤 REQUISIÇÃO: ${params.method} ${requestUrl}`,
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
          `API retornou HTML ao invés de JSON - Status: ${response.status}`,
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
          `Response Body (primeiros 2000 caracteres): ${responseText.substring(0, 2000)}`,
        );
        if (responseText.length > 2000) {
          this.logger.error(
            '[CronosService] ERROR',
            `... (total de ${responseText.length} caracteres)`,
          );
        }
        throw new Error(
          `Cronos API retornou HTML ao invés de JSON. Status: ${response.status}. Verifique a URL e autenticação.`,
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
          `Erro ao fazer parse do JSON - Status: ${response.status}`,
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
          `Response Body (primeiros 2000 caracteres): ${responseText.substring(0, 2000)}`,
        );
        if (responseText.length > 2000) {
          this.logger.error(
            '[CronosService] ERROR',
            `... (total de ${responseText.length} caracteres)`,
          );
        }
        throw new Error(
          `Cronos API retornou resposta inválida. Status: ${response.status}. Body: ${responseText.substring(0, 500)}`,
        );
      }

      if (
        (!response.ok || (result && result.success === false)) &&
        (response.status === 401 ||
          (result &&
            result.message &&
            typeof result.message === 'string' &&
            (result.message.includes('autorização') ||
              result.message.includes('authorization') ||
              result.message.includes('Sem autorização')))) &&
        params.useUserAuth &&
        params.document
      ) {
        this.logger.warn(
          '[CronosService] WARNING',
          `Erro de autorização detectado. Limpando cache e regenerando token do usuário para documento: ${params.document}`,
        );

        if (this.userAuth && this.userAuth[params.document]) {
          delete this.userAuth[params.document];
        }

        const newToken = await this.getUserToken(params.document);

        if (this.config.logging) {
          this.logger.info(
            '[CronosService]',
            `Reenviando requisição com novo token do usuário...`,
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
            `API retornou HTML ao invés de JSON após retry - Status: ${retryResponse.status}`,
          );
          throw new Error(
            `Cronos API retornou HTML ao invés de JSON após retry. Status: ${retryResponse.status}.`,
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
            `Erro ao fazer parse do JSON após retry: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          );
          throw new Error(
            `Cronos API retornou resposta inválida após retry. Status: ${retryResponse.status}.`,
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
        'Erro ao fazer requisição à API da Cronos',
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
          `Criando transferência PIX - document: ${params.document}, keyType: ${params.keyType}, keyValue: ${params.keyValue}`,
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
            'Transferência PIX criada usando token do usuário',
          );
        }
      } catch (userAuthError) {

        if (this.config.logging) {
          this.logger.warn(
            '[CronosService] WARNING',
            `Falha ao usar token do usuário, tentando com token da aplicação: ${userAuthError instanceof Error ? userAuthError.message : String(userAuthError)}`,
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
            'Transferência PIX criada usando token da aplicação',
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
        'Erro ao criar transferência PIX',
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
          `Confirmando transferência PIX - document: ${params.document}, id_pagamento: ${params.id}, amount: ${params.amount}`,
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
          'Transferência PIX confirmada com sucesso na API da Cronos',
        );
      }

      return result;
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        'Erro ao confirmar transferência PIX',
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
          `Criando token transacional - document: ${params.document}, amount: ${params.amount}, lat: ${params.lat || 0}, lon: ${params.lon || 0}`,
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
          'Token transacional criado com sucesso na API da Cronos',
        );
      }

      return result;
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        'Erro ao criar token transacional na API da Cronos',
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
          `Confirmando senha transacional na Cronos - document: ${params.document}`,
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
          'Senha transacional confirmada com sucesso na API da Cronos',
        );
      }

      return result;
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        'Erro ao confirmar senha transacional na API da Cronos',
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
          `Buscando saldo da conta - document: ${params.document}`,
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
          'Saldo da conta obtido com sucesso na API da Cronos',
        );
      }

      return result;
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        'Erro ao obter saldo da conta na API da Cronos',
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
          `Buscando transações - document: ${params.document}`,
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
          'Transações obtidas com sucesso na API da Cronos',
        );
      }

      return result;
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosService] CRITICAL ERROR',
        'Erro ao obter transações na API da Cronos',
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
        `Iniciando sincronização de saldo para usuário: ${params.userId}`,
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

      this.logger.info('[CronosService] 💰', 'Saldo Unex (Cronos):', {
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

        this.logger.info('[CronosService] 💰', 'Saldo Cronos (API):', {
          balance: cronosBalance,
          document: brIdentity.taxDocumentNumber,
        });
      } catch (cronosError: any) {
        this.logger.error(
          '[CronosService] ERROR',
          `Erro ao consultar saldo Cronos: ${cronosError?.message || String(cronosError)}`,
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
                `Encontradas ${pendingExchanges.length} operações de exchange pendentes:`,
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
        this.logger.success('[CronosService] SUCCESS', 'Saldos sincronizados:', {
          unexBalance,
          cronosBalance,
          difference,
        });
      }

      if (Math.abs(difference) > 0.01) {
        try {
          this.logger.info('[CronosService] 🔧', 'Iniciando ajuste de saldo');
          const balanceBefore = cronosAccount.balance;

          await this.prisma.usersAccounts.update({
            where: { id: cronosAccount.id },
            data: { balance: cronosBalance },
          });

          this.logger.success(
            '[CronosService] 💾',
            'Saldo BRL ajustado com sucesso:',
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
            `Erro ao ajustar saldo: ${adjustError?.message || String(adjustError)}`,
          );
        }
      }
    } catch (error: any) {
      this.logger.error(
        '[CronosService] ERROR',
        `Erro geral na sincronização: ${error?.message || String(error)}`,
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
}
