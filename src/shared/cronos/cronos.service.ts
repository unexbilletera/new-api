import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { ColoredLogger } from '../utils/logger-colors';
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

/**
 * Service para integração com API da Cronos
 * Responsável por chamadas à API externa da Cronos
 * Segue o padrão de autenticação da API antiga:
 * - Basic Auth (username:password) para obter token da aplicação
 * - User Auth (document:userPassword) para obter token do usuário
 */
@Injectable()
export class CronosService implements OnModuleInit {
  private config: CronosConfig;
  private appAuth: AppAuth | null = null;
  private userAuth: UserAuth = {};
  private fetchAgent: SocksProxyAgent | null = null;

  /**
   * Helper para fazer requisições fetch com suporte a proxy SOCKS
   */
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

    // Adicionar agent se proxy estiver configurado
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

    // Log de configuração para debug (só se logging estiver ativado)
    if (this.config.logging) {
      ColoredLogger.info(
        '[CronosService]',
        `Configuração inicializada - NODE_ENV: ${process.env.NODE_ENV || 'not set'}, URL: ${apiUrl || 'NÃO CONFIGURADA'}, Enable: ${this.config.enable}`,
      );
    }

    if (!this.config.enable) {
      ColoredLogger.warning(
        '[CronosService] ⚠️',
        'Cronos está desabilitado. Configure WALLET_CRONOS=enable',
      );
    }

    if (!apiUrl) {
      ColoredLogger.error(
        '[CronosService] ❌',
        'WALLET_CRONOS_URL não configurada!',
      );
    } else if (apiUrl.includes('stage')) {
      ColoredLogger.warning(
        '[CronosService] ⚠️',
        `ATENÇÃO: Usando URL de SANDBOX (stage): ${apiUrl}`,
      );
    }

    // Configurar proxy SOCKS se habilitado (igual à API antiga)
    // Na API antiga, o axios usa proxy quando USE_SOCKS_PROXY === 'true' ou WALLET_CRONOS_PROXY === 'enable'
    // Usamos node-fetch que suporta agent customizado para proxy SOCKS
    const useProxy =
      this.config.proxy ||
      process.env.USE_SOCKS_PROXY === 'true' ||
      this.configService.get('USE_SOCKS_PROXY') === 'true';

    if (useProxy) {
      try {
        const proxyPort = process.env.SOCKS_PROXY_PORT || '8080';
        const proxyUrl = `socks5h://localhost:${proxyPort}`;
        this.fetchAgent = new SocksProxyAgent(proxyUrl);

        ColoredLogger.warning(
          '[CronosService] ⚠️',
          `Proxy SOCKS habilitado - localhost:${proxyPort} (igual à API antiga)`,
        );
      } catch (error) {
        ColoredLogger.error(
          '[CronosService] ❌',
          `Erro ao configurar proxy SOCKS: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Continua sem proxy se houver erro
        this.fetchAgent = null;
      }
    }
  }

  /**
   * Obtém token da aplicação usando Basic Auth
   * Token é cacheado por 1 hora
   */
  private async getAppToken(): Promise<string> {
    try {
      // Verificar cache (token válido por 1 hora)
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

      // Basic Auth
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
        ColoredLogger.error(
          '[CronosService] ❌',
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
        ColoredLogger.error(
          '[CronosService] ❌',
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
        ColoredLogger.error(
          '[CronosService] ❌',
          `Token não encontrado na resposta: ${JSON.stringify(result)}`,
        );
        throw new Error('Invalid response from Cronos API - missing token');
      }

      // Cache do token
      this.appAuth = {
        token: result.token,
        time: Date.now(),
      };

      if (this.config.logging) {
        ColoredLogger.success(
          '[CronosService] ✅',
          'Token da aplicação obtido com sucesso',
        );
      }

      return result.token;
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[CronosService] ❌ ERRO CRÍTICO',
        'Erro ao obter token da aplicação',
        error,
      );
      throw error;
    }
  }

  /**
   * Obtém token do usuário usando document e userPassword
   * Token é cacheado por 1 hora por documento
   * IMPORTANTE: Este endpoint requer o token da aplicação no header (não useUserAuth)
   */
  private async getUserToken(document: string): Promise<string> {
    try {
      if (!document) {
        throw new Error('Missing document parameter');
      }

      // Verificar cache (token válido por 1 hora)
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

      // IMPORTANTE: O endpoint /api/v1/user/auth requer o token da aplicação no header
      // Na API antiga, getUserToken chama helper.request SEM useUserAuth, então usa app token
      if (this.config.logging) {
        ColoredLogger.info(
          '[CronosService]',
          `Fazendo login do usuário na Cronos - document: ${document}, userPassword configurado: ${this.config.userPassword ? 'SIM' : 'NÃO'}`,
        );
      }

      // Obter token da aplicação primeiro
      const appToken = await this.getAppToken();

      const requestUrl = `${this.config.apiUrl}/api/v1/user/auth`;
      const requestBody = {
        document,
        password: this.config.userPassword,
      };

      if (this.config.logging) {
        ColoredLogger.debug('[CronosService]', `POST ${requestUrl}`);
        ColoredLogger.debug(
          '[CronosService]',
          `Request Body: ${JSON.stringify({ ...requestBody, password: '***' }, null, 2)}`, // Não logar senha
        );
        ColoredLogger.debug(
          '[CronosService]',
          `Headers: Authorization: Bearer ${appToken.substring(0, 20)}...`, // Logar apenas início do token
        );
      }

      const response: Response = await this.fetchWithProxy(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${appToken}`, // Requer token da aplicação
        },
        body: JSON.stringify(requestBody),
      });

      // Ler resposta como texto primeiro para poder logar antes de fazer parse
      const responseText: string = await response.text();

      if (this.config.logging) {
        ColoredLogger.debug(
          '[CronosService]',
          `Response Status: ${response.status} ${response.statusText}`,
        );
        const headersObject: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headersObject[key] = value;
        });
        ColoredLogger.debug(
          '[CronosService]',
          `Response Headers: ${JSON.stringify(headersObject)}`,
        );
        try {
          const responseJson = JSON.parse(responseText) as unknown;
          ColoredLogger.debug(
            '[CronosService]',
            `Response Body: ${JSON.stringify(responseJson, null, 2)}`,
          );
        } catch {
          ColoredLogger.debug(
            '[CronosService]',
            `Response Body (text): ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`,
          );
        }
      }

      if (!response.ok) {
        ColoredLogger.error(
          '[CronosService] ❌',
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
        ColoredLogger.error(
          '[CronosService] ❌',
          `Erro ao fazer parse da resposta: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        );
        ColoredLogger.error(
          '[CronosService] ❌',
          `Response Text: ${responseText.substring(0, 500)}`,
        );
        throw new Error(
          `Invalid JSON response from Cronos API: ${responseText.substring(0, 200)}`,
        );
      }

      if (!result || !result.token) {
        ColoredLogger.error(
          '[CronosService] ❌',
          `Token não encontrado na resposta: ${JSON.stringify(result)}`,
        );
        throw new Error('Invalid response from Cronos API - missing token');
      }

      // Cache do token
      if (!this.userAuth) {
        this.userAuth = {};
      }
      this.userAuth[document] = {
        token: result.token,
        time: Date.now(),
      };

      if (this.config.logging) {
        ColoredLogger.success(
          '[CronosService] ✅',
          `Token do usuário obtido com sucesso para documento: ${document}`,
        );
      }

      return result.token;
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[CronosService] ❌ ERRO CRÍTICO',
        `Erro ao obter token do usuário para documento: ${document}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Faz uma requisição à API da Cronos
   */
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

      // Obter token apropriado
      const token = params.useUserAuth
        ? await this.getUserToken(params.document!)
        : await this.getAppToken();

      if (!token) {
        throw new Error('Invalid authorization token');
      }

      // IMPORTANTE: O token usado aqui é o token da Cronos obtido via getUserToken (quando useUserAuth: true)
      // ou o token da aplicação obtido via getAppToken (quando useUserAuth: false)
      // Ambos são tokens da Cronos, não tokens do nosso app
      const requestUrl = `${this.config.apiUrl}${params.action}`;
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // Token da Cronos (obtido do login na Cronos)
      };
      const requestBody = params.body ? JSON.stringify(params.body) : undefined;

      // Log de requisição completa se habilitado
      if (this.config.logging) {
        ColoredLogger.info(
          '[CronosService]',
          '═══════════════════════════════════════════════════════',
        );
        ColoredLogger.info(
          '[CronosService]',
          `📤 REQUISIÇÃO: ${params.method} ${requestUrl}`,
        );
        ColoredLogger.info(
          '[CronosService]',
          '───────────────────────────────────────────────────────',
        );
        ColoredLogger.debug(
          '[CronosService]',
          `Token Type: ${params.useUserAuth ? 'USER_TOKEN (Cronos)' : 'APP_TOKEN (Cronos)'}`,
        );
        if (params.useUserAuth && params.document) {
          ColoredLogger.debug(
            '[CronosService]',
            `User Document: ${params.document} | Token Cached: ${this.userAuth && this.userAuth[params.document] ? 'YES' : 'NO'}`,
          );
        }
        ColoredLogger.debug(
          '[CronosService]',
          `Authorization: Bearer ${token.substring(0, 30)}...${token.substring(token.length - 10)}`,
        );
        ColoredLogger.debug(
          '[CronosService]',
          `Headers:\n${JSON.stringify(requestHeaders, null, 2)}`,
        );
        if (requestBody) {
          ColoredLogger.debug(
            '[CronosService]',
            `Request Body:\n${JSON.stringify(params.body, null, 2)}`,
          );
        } else {
          ColoredLogger.debug('[CronosService]', 'Request Body: (empty)');
        }
        ColoredLogger.info(
          '[CronosService]',
          '───────────────────────────────────────────────────────',
        );
      }

      let response: Response = await this.fetchWithProxy(requestUrl, {
        method: params.method,
        headers: requestHeaders,
        body: requestBody,
      });

      // Ler o body como texto primeiro para verificar se é JSON
      let responseText: string = await response.text();

      // Log de resposta completa se habilitado
      if (this.config.logging) {
        ColoredLogger.info(
          '[CronosService]',
          `📥 RESPOSTA: ${response.status} ${response.statusText}`,
        );
        ColoredLogger.info(
          '[CronosService]',
          '───────────────────────────────────────────────────────',
        );
        const headersObject: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headersObject[key] = value;
        });
        ColoredLogger.debug(
          '[CronosService]',
          `Response Headers:\n${JSON.stringify(headersObject, null, 2)}`,
        );
        try {
          const responseJson = JSON.parse(responseText) as unknown;
          ColoredLogger.debug(
            '[CronosService]',
            `Response Body:\n${JSON.stringify(responseJson, null, 2)}`,
          );
        } catch {
          ColoredLogger.debug(
            '[CronosService]',
            `Response Body (text):\n${responseText.substring(0, 1000)}${
              responseText.length > 1000 ? '\n... (truncated)' : ''
            }`,
          );
        }
        ColoredLogger.info(
          '[CronosService]',
          '═══════════════════════════════════════════════════════',
        );
      }

      // Verificar se a resposta é HTML (erro do servidor)
      if (
        responseText.trim().startsWith('<!DOCTYPE') ||
        responseText.trim().startsWith('<html')
      ) {
        ColoredLogger.error(
          '[CronosService] ❌ ERRO CRÍTICO',
          `API retornou HTML ao invés de JSON - Status: ${response.status}`,
        );
        ColoredLogger.error(
          '[CronosService] ❌',
          `URL: ${params.method} ${this.config.apiUrl}${params.action}`,
        );
        const headersObject: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headersObject[key] = value;
        });
        ColoredLogger.error(
          '[CronosService] ❌',
          `Response Headers: ${JSON.stringify(headersObject)}`,
        );
        ColoredLogger.error(
          '[CronosService] ❌',
          `Response Body (primeiros 2000 caracteres): ${responseText.substring(0, 2000)}`,
        );
        if (responseText.length > 2000) {
          ColoredLogger.error(
            '[CronosService] ❌',
            `... (total de ${responseText.length} caracteres)`,
          );
        }
        throw new Error(
          `Cronos API retornou HTML ao invés de JSON. Status: ${response.status}. Verifique a URL e autenticação.`,
        );
      }

      // Tentar fazer parse do JSON
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
        ColoredLogger.error(
          '[CronosService] ❌ ERRO CRÍTICO',
          `Erro ao fazer parse do JSON - Status: ${response.status}`,
        );
        ColoredLogger.error(
          '[CronosService] ❌',
          `Erro de parse: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        );
        ColoredLogger.error(
          '[CronosService] ❌',
          `URL: ${params.method} ${this.config.apiUrl}${params.action}`,
        );
        ColoredLogger.error(
          '[CronosService] ❌',
          `Response Body (primeiros 2000 caracteres): ${responseText.substring(0, 2000)}`,
        );
        if (responseText.length > 2000) {
          ColoredLogger.error(
            '[CronosService] ❌',
            `... (total de ${responseText.length} caracteres)`,
          );
        }
        throw new Error(
          `Cronos API retornou resposta inválida. Status: ${response.status}. Body: ${responseText.substring(0, 500)}`,
        );
      }

      // Se houver erro de autorização E estivermos usando userAuth, tentar regenerar o token e retry
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
        ColoredLogger.warning(
          '[CronosService] ⚠️',
          `Erro de autorização detectado. Limpando cache e regenerando token do usuário para documento: ${params.document}`,
        );

        // Limpar cache do token do usuário para forçar regeneração
        if (this.userAuth && this.userAuth[params.document]) {
          delete this.userAuth[params.document];
        }

        // Obter novo token
        const newToken = await this.getUserToken(params.document);

        if (this.config.logging) {
          ColoredLogger.info(
            '[CronosService]',
            `Reenviando requisição com novo token do usuário...`,
          );
        }

        // Tentar novamente com o novo token
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

        // Verificar HTML novamente
        if (
          retryResponseText.trim().startsWith('<!DOCTYPE') ||
          retryResponseText.trim().startsWith('<html')
        ) {
          ColoredLogger.error(
            '[CronosService] ❌ ERRO CRÍTICO',
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
          ColoredLogger.error(
            '[CronosService] ❌ ERRO CRÍTICO',
            `Erro ao fazer parse do JSON após retry: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          );
          throw new Error(
            `Cronos API retornou resposta inválida após retry. Status: ${retryResponse.status}.`,
          );
        }

        // Usar a resposta do retry
        response = retryResponse;
        responseText = retryResponseText;
      }

      if (!response.ok || (result && result.success === false)) {
        ColoredLogger.error(
          '[CronosService] ❌',
          `Erro na resposta: ${response.status} - ${JSON.stringify(result, null, 2)}`,
        );
        ColoredLogger.error(
          '[CronosService] ❌',
          `URL: ${params.method} ${this.config.apiUrl}${params.action}`,
        );
        ColoredLogger.error(
          '[CronosService] ❌',
          `Request Body: ${JSON.stringify(params.body || {}, null, 2)}`,
        );
        throw new Error(
          `Cronos API error: ${response.status} - ${JSON.stringify(result, null, 2)}`,
        );
      }

      if (this.config.logging) {
        ColoredLogger.success(
          '[CronosService] ✅',
          `Resposta recebida: ${JSON.stringify(result)}`,
        );
      }

      return result;
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[CronosService] ❌ ERRO CRÍTICO',
        'Erro ao fazer requisição à API da Cronos',
        error,
      );
      throw error;
    }
  }

  /**
   * Busca informações do destinatário PIX na API da Cronos
   * Retorna dados do recebedor (nome, documento, banco, conta, etc.)
   *
   * @param document - CPF/CNPJ do pagador
   * @param keyType - Tipo da chave PIX (cpf, cnpj, email, phone, evp)
   * @param keyValue - Valor da chave PIX
   * @returns Dados do recebedor retornados pela API da Cronos
   */
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

      // Mapear tipos de chave PIX para o formato da Cronos
      const cronosKeyType = this.mapKeyTypeToCronos(params.keyType);

      // NOTA: A API antiga usa useUserAuth: true, o que requer fazer login do usuário
      // na Cronos usando document + userPassword. Se isso falhar, pode ser porque:
      // 1. O userPassword configurado está incorreto
      // 2. A senha do usuário na Cronos é diferente do userPassword configurado
      // Se não funcionar, podemos tentar usar apenas o token da aplicação (useUserAuth: false)
      // mas isso pode não funcionar dependendo dos requisitos da API da Cronos

      if (this.config.logging) {
        ColoredLogger.info(
          '[CronosService]',
          `Criando transferência PIX - document: ${params.document}, keyType: ${params.keyType}, keyValue: ${params.keyValue}`,
        );
      }

      // Tentar primeiro com useUserAuth (como na API antiga)
      // Se falhar, tentar apenas com token da aplicação
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
          useUserAuth: true, // Usa token do usuário (requer getUserToken que faz login)
          body: {
            key_type: cronosKeyType,
            key_value: params.keyValue,
          },
        })) as typeof result;

        if (this.config.logging) {
          ColoredLogger.success(
            '[CronosService] ✅',
            'Transferência PIX criada usando token do usuário',
          );
        }
      } catch (userAuthError) {
        // Se falhar com useUserAuth (ex: credenciais inválidas), tentar apenas com token da aplicação
        if (this.config.logging) {
          ColoredLogger.warning(
            '[CronosService] ⚠️',
            `Falha ao usar token do usuário, tentando com token da aplicação: ${userAuthError instanceof Error ? userAuthError.message : String(userAuthError)}`,
          );
        }

        result = (await this.request({
          method: 'POST',
          action: '/api/v1/pix/criartransferencia',
          useUserAuth: false, // Usa apenas token da aplicação
          body: {
            key_type: cronosKeyType,
            key_value: params.keyValue,
            document: params.document, // Passar document no body se necessário
          },
        })) as typeof result;

        if (this.config.logging) {
          ColoredLogger.success(
            '[CronosService] ✅',
            'Transferência PIX criada usando token da aplicação',
          );
        }
      }

      // Validar resposta da API
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
      ColoredLogger.errorWithStack(
        '[CronosService] ❌ ERRO CRÍTICO',
        'Erro ao criar transferência PIX',
        error,
      );
      throw error;
    }
  }

  /**
   * Confirma uma transferência PIX na API da Cronos
   *
   * @param document - CPF/CNPJ do pagador
   * @param id - ID do pagamento (id_pagamento) retornado pelo transferPix
   * @param amount - Valor da transferência
   * @param description - Descrição da transferência (opcional)
   * @returns Resultado da confirmação
   */
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
        ColoredLogger.info(
          '[CronosService]',
          `Confirmando transferência PIX - document: ${params.document}, id_pagamento: ${params.id}, amount: ${params.amount}`,
        );
      }

      // IMPORTANTE: O formato do body deve seguir a documentação da API da Cronos
      // Documentação: valor deve ser string, save_as_favorite deve ser number
      // Na API antiga (linha 1954-1957), passa params.amount (número), mas o axios converte automaticamente para string no JSON
      // Para garantir compatibilidade com a documentação, vamos passar como string explicitamente
      const result = (await this.request({
        method: 'POST',
        action: '/api/v1/pix/confirmartransferencia',
        document: params.document,
        useUserAuth: true, // IMPORTANTE: Deve usar o mesmo token do usuário usado no transferPix
        body: {
          id_pagamento: params.id, // A API usa id_pagamento (ID retornado pelo transferPix)
          valor: params.amount, // Na API antiga é passado como número (params.amount), axios serializa automaticamente
          description: params.description || '', // String vazia se não tiver descrição (igual API antiga)
          save_as_favorite: 0, // Sempre 0 (número) - não salvar como favorito
        },
      })) as unknown;

      if (this.config.logging) {
        ColoredLogger.success(
          '[CronosService] ✅',
          'Transferência PIX confirmada com sucesso na API da Cronos',
        );
      }

      return result;
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[CronosService] ❌ ERRO CRÍTICO',
        'Erro ao confirmar transferência PIX',
        error,
      );
      throw error;
    }
  }

  /**
   * Cria um token transacional na API da Cronos
   *
   * Equivalente ao helper antigo: createTransactionalToken
   *
   * @param document - CPF/CNPJ do pagador
   * @param amount - Valor da transação
   * @param lat - Latitude (opcional)
   * @param lon - Longitude (opcional)
   */
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
        ColoredLogger.info(
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
        ColoredLogger.success(
          '[CronosService] ✅',
          'Token transacional criado com sucesso na API da Cronos',
        );
      }

      return result;
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[CronosService] ❌ ERRO CRÍTICO',
        'Erro ao criar token transacional na API da Cronos',
        error,
      );
      throw error;
    }
  }

  /**
   * Confirma a senha transacional na API da Cronos
   *
   * Equivalente ao helper antigo: confirmTransactionPassword
   *
   * @param document - CPF/CNPJ do pagador
   */
  async confirmTransactionPassword(params: { document: string }): Promise<any> {
    try {
      if (!params.document) {
        throw new Error('Missing document. Invalid parameters');
      }

      if (!this.config.userPassword) {
        throw new Error('Cronos userPassword not configured');
      }

      if (this.config.logging) {
        ColoredLogger.info(
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
        ColoredLogger.success(
          '[CronosService] ✅',
          'Senha transacional confirmada com sucesso na API da Cronos',
        );
      }

      return result;
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[CronosService] ❌ ERRO CRÍTICO',
        'Erro ao confirmar senha transacional na API da Cronos',
        error,
      );
      throw error;
    }
  }

  /**
   * Obtém o saldo da conta na API da Cronos
   *
   * Equivalente ao helper antigo: getAccountBalance
   *
   * @param document - CPF/CNPJ do usuário
   * @returns Saldo da conta
   */
  async getAccountBalance(params: {
    document: string;
  }): Promise<{ amount?: number; balance?: number; saldo?: number }> {
    try {
      if (!params.document) {
        throw new Error('Missing document. Invalid parameters');
      }

      if (this.config.logging) {
        ColoredLogger.info(
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
        ColoredLogger.success(
          '[CronosService] ✅',
          'Saldo da conta obtido com sucesso na API da Cronos',
        );
      }

      return result;
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[CronosService] ❌ ERRO CRÍTICO',
        'Erro ao obter saldo da conta na API da Cronos',
        error,
      );
      throw error;
    }
  }

  /**
   * Obtém transações/extratos da conta na API da Cronos
   *
   * Equivalente ao helper antigo: getTransactions
   *
   * @param document - CPF/CNPJ do usuário
   * @param startDate - Data inicial (formato: YYYY-MM-DD HH:mm:ss)
   * @param endDate - Data final (formato: YYYY-MM-DD HH:mm:ss)
   * @param searchtext - Texto de busca (opcional)
   * @param type_transaction - Tipo de transação (opcional)
   * @param limit - Limite de resultados (opcional)
   * @returns Transações/extratos
   */
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
        ColoredLogger.info(
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
        ColoredLogger.success(
          '[CronosService] ✅',
          'Transações obtidas com sucesso na API da Cronos',
        );
      }

      return result;
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[CronosService] ❌ ERRO CRÍTICO',
        'Erro ao obter transações na API da Cronos',
        error,
      );
      throw error;
    }
  }

  /**
   * Sincroniza o saldo da conta Cronos com o saldo na API da Cronos
   *
   * Equivalente ao middleware antigo: syncCronosBalance
   *
   * @param userId - ID do usuário
   * @param userIdentities - Identidades do usuário
   * @param userAccounts - Contas do usuário
   */
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

      ColoredLogger.info(
        '[CronosService] 🔄',
        `Iniciando sincronização de saldo para usuário: ${params.userId}`,
      );

      // Buscar identidade BR
      const brIdentity = params.userIdentities?.find(
        (id) => id.country === 'br' && id.status === 'enable',
      );

      if (!brIdentity) {
        ColoredLogger.warning(
          '[CronosService] ⚠️',
          'Usuário não possui identidade BR ativa',
        );
        return;
      }

      // Buscar conta Cronos (BRL)
      const cronosAccount = params.userAccounts?.find(
        (acc) => acc.type === 'cronos' && acc.status === 'enable',
      );

      if (!cronosAccount) {
        ColoredLogger.warning(
          '[CronosService] ⚠️',
          'Usuário não possui conta Cronos ativa',
        );
        return;
      }

      const unexBalance = parseFloat(cronosAccount.balance || '0');

      ColoredLogger.info('[CronosService] 💰', 'Saldo Unex (Cronos):', {
        accountId: cronosAccount.id,
        balance: unexBalance,
        document: brIdentity.taxDocumentNumber,
      });

      // Buscar saldo atual na Cronos API
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

        ColoredLogger.info('[CronosService] 💰', 'Saldo Cronos (API):', {
          balance: cronosBalance,
          document: brIdentity.taxDocumentNumber,
        });
      } catch (cronosError: any) {
        ColoredLogger.error(
          '[CronosService] ❌',
          `Erro ao consultar saldo Cronos: ${cronosError?.message || String(cronosError)}`,
        );
        return; // Não bloqueia por erro na API
      }

      // Detectar discrepância
      const difference = Math.abs(unexBalance - cronosBalance);
      const tolerance = 0.01; // 1 centavo de diferença é aceitável

      if (difference > tolerance) {
        ColoredLogger.warning('[CronosService] ⚠️', 'DISCREPÂNCIA DETECTADA:', {
          unexBalance,
          cronosBalance,
          difference,
          discrepancyPercentage: `${(
            (difference / Math.max(unexBalance, cronosBalance)) *
            100
          ).toFixed(2)}%`,
        });

        // Se Cronos está zerado mas Unex tem saldo, buscar statements recentes
        if (cronosBalance === 0 && unexBalance > 0) {
          ColoredLogger.info(
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

            ColoredLogger.info(
              '[CronosService] 📋',
              'Statements recentes encontrados:',
              {
                count: (statements?.statements || []).length,
                startDate,
                endDate,
              },
            );

            // Procurar por cashin_cronos pendentes que não foram processados
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
              ColoredLogger.warning(
                '[CronosService] ⚠️',
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

            // Procurar por exchange pendentes
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
              ColoredLogger.warning(
                '[CronosService] ⚠️',
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
            ColoredLogger.error(
              '[CronosService] ⚠️',
              `Erro ao verificar statements: ${stmtError?.message || String(stmtError)}`,
            );
          }
        }
      } else {
        ColoredLogger.success('[CronosService] ✅', 'Saldos sincronizados:', {
          unexBalance,
          cronosBalance,
          difference,
        });
      }

      // Se há discrepância, ajustar o saldo da conta BRL (Cronos)
      if (Math.abs(difference) > 0.01) {
        try {
          ColoredLogger.info('[CronosService] 🔧', 'Iniciando ajuste de saldo');
          const balanceBefore = cronosAccount.balance;

          await this.prisma.usersAccounts.update({
            where: { id: cronosAccount.id },
            data: { balance: cronosBalance },
          });

          ColoredLogger.success(
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
          ColoredLogger.error(
            '[CronosService] ❌',
            `Erro ao ajustar saldo: ${adjustError?.message || String(adjustError)}`,
          );
        }
      }
    } catch (error: any) {
      ColoredLogger.error(
        '[CronosService] ❌',
        `Erro geral na sincronização: ${error?.message || String(error)}`,
      );
      // Não rejeita para não bloquear o login
    }
  }

  /**
   * Obtém o webhookSecret configurado (para validação de webhooks)
   */
  getWebhookSecret(): string {
    return this.config?.webhookSecret || '';
  }

  /**
   * Verifica se o Cronos está habilitado
   */
  isEnabled(): boolean {
    return this.config?.enable || false;
  }

  /**
   * Mapeia o tipo de chave PIX para o formato esperado pela Cronos
   */
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
