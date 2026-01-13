import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import {
  AppConfig,
  MockConfig,
  SmsMockConfig,
  EmailMockConfig,
  ValidaConfig,
  SandboxConfig,
  EnvironmentConfig,
} from './config.types';

@Injectable()
export class AppConfigService implements OnModuleInit {
  private config: AppConfig;

  constructor(
    private readonly configService: NestConfigService,
    private readonly logger: LoggerService,
  ) {
    this.config = this.loadConfig();
  }

  onModuleInit(): void {}

  private loadConfig(): AppConfig {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const isProduction = nodeEnv === 'production';
    const isDevelopment = nodeEnv === 'development';
    const isStaging = nodeEnv === 'staging';
    const environment: EnvironmentConfig = {
      nodeEnv,
      environmentName: this.getEnvironmentName(nodeEnv),
      isProduction,
      isDevelopment,
      isStaging,
    };
    const mock = this.loadMockConfig();
    const sandbox = this.loadSandboxConfig(environment);
    const smsMock = this.loadSmsMockConfig(mock, sandbox, environment);
    const emailMock = this.loadEmailMockConfig(mock, environment);

    return {
      mock,
      smsMock,
      emailMock,
      valida: this.loadValidaConfig(),
      sandbox,
      environment,
    };
  }

  private loadMockConfig(): MockConfig {
    const enableCodes =
      this.configService.get<string>('ENABLE_MOCK_CODES', 'false') === 'true' ||
      this.configService.get<string>('ENABLE_MOCK_CODES', 'false') === '1';

    return {
      enableCodes,
      code6Digits: '111111',
      code8Digits: '11111111',
    };
  }

  private loadSmsMockConfig(
    mock: MockConfig,
    sandbox: SandboxConfig,
    environment: EnvironmentConfig,
  ): SmsMockConfig {
    const mockCodesEnabled = mock.enableCodes;
    const sandboxEnabled = sandbox.enable;
    const nodeEnv = environment.nodeEnv;

    const enabled =
      mockCodesEnabled || sandboxEnabled || nodeEnv !== 'production';

    return {
      enabled,
      useFixedCode: enabled,
    };
  }

  private loadEmailMockConfig(
    mock: MockConfig,
    environment: EnvironmentConfig,
  ): EmailMockConfig {
    const mockCodesEnabled = mock.enableCodes;
    const nodeEnv = environment.nodeEnv;

    const enabled = mockCodesEnabled || nodeEnv !== 'production';

    return {
      enabled,
      useFixedCode: enabled,
    };
  }

  private loadValidaConfig(): ValidaConfig {
    const validaEnabled =
      (
        this.configService.get<string>('VALIDA_ENABLED', '') || ''
      ).toLowerCase() === 'true' ||
      this.configService.get<string>('WALLET_VALIDA', '') === 'enable';

    return {
      enable: validaEnabled,
      logging:
        this.configService.get<string>('WALLET_VALIDA_LOG', '') === 'enable',
      apiUrl: this.configService.get<string>('WALLET_VALIDA_URL', ''),
      username: this.configService.get<string>('WALLET_VALIDA_USERNAME', ''),
      password: this.configService.get<string>('WALLET_VALIDA_PASSWORD', ''),
      theme: this.configService.get<string>('WALLET_VALIDA_THEME', ''),
      webhookSecret: this.configService.get<string>(
        'WALLET_VALIDA_WEBHOOK_SECRET',
        '',
      ),
      tokenTimeoutMin: 45,
      enrollmentFlow: 'ldr',
      hideQr: true,
      disableFileUpload: true,
      allowIdRecovery: false,
    };
  }

  private loadSandboxConfig(environment: EnvironmentConfig): SandboxConfig {
    return {
      enable:
        this.configService.get<string>('WALLET_SANDBOX', '') === 'enable' ||
        environment.nodeEnv !== 'production',
      userId: '00000000-0000-0000-0000-000000000000',
      skipSecurity:
        this.configService.get<string>('WALLET_SANDBOX_SKIP_SECURITY', '') ===
        'enable',
      sendPush:
        this.configService.get<string>('WALLET_SANDBOX_SEND_PUSH', '') ===
        'enable',
      sendMail:
        this.configService.get<string>('WALLET_SANDBOX_SEND_MAIL', '') ===
        'enable',
    };
  }

  private getEnvironmentName(nodeEnv: string): string {
    const envMap: Record<string, string> = {
      development: '🛠️  DEVELOPMENT',
      staging: '🧪 STAGING',
      production: '🚀 PRODUCTION',
    };

    return envMap[nodeEnv] || `📦 ${nodeEnv.toUpperCase()}`;
  }

  getConfig(): AppConfig {
    return this.config;
  }

  getMockConfig(): MockConfig {
    return this.config.mock;
  }

  getSmsMockConfig(): SmsMockConfig {
    return this.config.smsMock;
  }

  getEmailMockConfig(): EmailMockConfig {
    return this.config.emailMock;
  }

  getValidaConfig(): ValidaConfig {
    return this.config.valida;
  }

  getSandboxConfig(): SandboxConfig {
    return this.config.sandbox;
  }

  getEnvironmentConfig(): EnvironmentConfig {
    return this.config.environment;
  }

  isMockCodesEnabled(): boolean {
    return this.config.mock.enableCodes;
  }

  isMockCode(code: string | null | undefined): boolean {
    if (!code || typeof code !== 'string') return false;
    return (
      code === this.config.mock.code6Digits ||
      code === this.config.mock.code8Digits
    );
  }

  isSmsMockEnabled(): boolean {
    return this.config.smsMock.enabled;
  }

  isEmailMockEnabled(): boolean {
    return this.config.emailMock.enabled;
  }

  isValidaEnabled(): boolean {
    return this.config.valida.enable;
  }

  isSandboxEnabled(): boolean {
    return this.config.sandbox.enable;
  }

  getMockCode6Digits(): string {
    return this.config.mock.code6Digits;
  }

  getMockCode8Digits(): string {
    return this.config.mock.code8Digits;
  }
}

@Injectable()
export class ConfigService {
  get databaseUrl(): string {
    return process.env.WALLET_MYSQL_URL || '';
  }

  get jwtSecret(): string {
    return (
      process.env.JWT_SECRET ||
      process.env.WALLET_TOKEN_SECRET ||
      'default-secret-change-in-production'
    );
  }

  get jwtExpiresIn(): string {
    return (
      process.env.JWT_EXPIRES_IN || process.env.WALLET_TOKEN_EXPIRE || '24h'
    );
  }

  get serverPort(): number {
    return parseInt(
      process.env.PORT || process.env.WALLET_SERVER_PORT || '3000',
      10,
    );
  }

  get serverUrl(): string {
    return (
      process.env.SERVER_URL ||
      process.env.WALLET_SERVER_URL ||
      'http://localhost:3000'
    );
  }

  get redisUrl(): string {
    return process.env.REDIS_URL || process.env.WALLET_REDIS_URL || '';
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isSandbox(): boolean {
    return this.nodeEnv === 'sandbox';
  }

  get isDevelopment(): boolean {
    return (
      this.nodeEnv === 'development' || (!this.isProduction && !this.isSandbox)
    );
  }

  get(key: string, defaultValue?: string): string | undefined {
    return process.env[key] || defaultValue;
  }
}
