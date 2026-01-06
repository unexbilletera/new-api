import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.config = this.loadConfig();
  }

  onModuleInit() {
    this.logEnvironmentInfo();
  }

  private loadConfig(): AppConfig {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const isProduction = nodeEnv === 'production';
    const isDevelopment = nodeEnv === 'development';
    const isStaging = nodeEnv === 'staging';

    return {
      mock: this.loadMockConfig(),
      smsMock: this.loadSmsMockConfig(),
      emailMock: this.loadEmailMockConfig(),
      valida: this.loadValidaConfig(),
      sandbox: this.loadSandboxConfig(),
      environment: {
        nodeEnv,
        environmentName: this.getEnvironmentName(nodeEnv),
        isProduction,
        isDevelopment,
        isStaging,
      },
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

  private loadSmsMockConfig(): SmsMockConfig {
    const mockCodesEnabled = this.getMockConfig().enableCodes;
    const sandboxEnabled = this.getSandboxConfig().enable;
    const nodeEnv = this.getEnvironmentConfig().nodeEnv;

    const enabled = mockCodesEnabled || sandboxEnabled || nodeEnv !== 'production';

    return {
      enabled,
      useFixedCode: enabled,
    };
  }

  private loadEmailMockConfig(): EmailMockConfig {
    const mockCodesEnabled = this.getMockConfig().enableCodes;
    const nodeEnv = this.getEnvironmentConfig().nodeEnv;

    const enabled = mockCodesEnabled || nodeEnv !== 'production';

    return {
      enabled,
      useFixedCode: enabled,
    };
  }

  private loadValidaConfig(): ValidaConfig {
    const validaEnabled = 
      this.configService.get<string>('VALIDA_ENABLED', '').toLowerCase() === 'true' ||
      this.configService.get<string>('WALLET_VALIDA', '') === 'enable';
    
    return {
      enable: validaEnabled,
      logging: this.configService.get<string>('WALLET_VALIDA_LOG', '') === 'enable',
      apiUrl: this.configService.get<string>('WALLET_VALIDA_URL', ''),
      username: this.configService.get<string>('WALLET_VALIDA_USERNAME', ''),
      password: this.configService.get<string>('WALLET_VALIDA_PASSWORD', ''),
      theme: this.configService.get<string>('WALLET_VALIDA_THEME', ''),
      webhookSecret: this.configService.get<string>('WALLET_VALIDA_WEBHOOK_SECRET', ''),
      tokenTimeoutMin: 45,
      enrollmentFlow: 'ldr',
      hideQr: true,
      disableFileUpload: true,
      allowIdRecovery: false,
    };
  }

  private loadSandboxConfig(): SandboxConfig {
    return {
      enable:
        this.configService.get<string>('WALLET_SANDBOX', '') === 'enable' ||
        this.configService.get<string>('NODE_ENV', '') !== 'production',
      userId: '00000000-0000-0000-0000-000000000000',
      skipSecurity: this.configService.get<string>('WALLET_SANDBOX_SKIP_SECURITY', '') === 'enable',
      sendPush: this.configService.get<string>('WALLET_SANDBOX_SEND_PUSH', '') === 'enable',
      sendMail: this.configService.get<string>('WALLET_SANDBOX_SEND_MAIL', '') === 'enable',
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

  private logEnvironmentInfo(): void {
    const env = this.getEnvironmentConfig();
    const mock = this.getMockConfig();
    const smsMock = this.getSmsMockConfig();
    const emailMock = this.getEmailMockConfig();
    const valida = this.getValidaConfig();
    const sandbox = this.getSandboxConfig();

    this.logger.info('═══════════════════════════════════════════════════════════');
    this.logger.info(`Environment: ${env.environmentName}`);
    this.logger.info(`NODE_ENV: ${env.nodeEnv}`);
    this.logger.info('═══════════════════════════════════════════════════════════');

    if (mock.enableCodes) {
      this.logger.warn('🔧 MOCK CODES: ENABLED');
      this.logger.warn(`   - Código 6 dígitos: ${mock.code6Digits}`);
      this.logger.warn(`   - Código 8 dígitos: ${mock.code8Digits}`);
    } else {
      this.logger.info('✅ MOCK CODES: DISABLED');
    }

    if (smsMock.enabled) {
      this.logger.warn('📱 SMS MOCK: ENABLED (SMS não será enviado)');
    } else {
      this.logger.info('✅ SMS MOCK: DISABLED (SMS será enviado)');
    }

    if (emailMock.enabled) {
      this.logger.warn('📧 EMAIL MOCK: ENABLED (Email não será enviado)');
    } else {
      this.logger.info('✅ EMAIL MOCK: DISABLED (Email será enviado)');
    }

    if (valida.enable) {
      this.logger.info('🔐 VALIDA: ENABLED');
      if (valida.logging) {
        this.logger.info('   - Logging: ENABLED');
      }
    } else {
      this.logger.info('⚪ VALIDA: DISABLED');
    }

    if (sandbox.enable) {
      this.logger.warn('🧪 SANDBOX MODE: ENABLED');
      if (sandbox.skipSecurity) {
        this.logger.warn('   - Skip Security: ENABLED');
      }
      if (sandbox.sendPush) {
        this.logger.info('   - Send Push: ENABLED');
      }
      if (sandbox.sendMail) {
        this.logger.info('   - Send Mail: ENABLED');
      }
    } else {
      this.logger.info('✅ SANDBOX MODE: DISABLED');
    }

    this.logger.info('═══════════════════════════════════════════════════════════');
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
    return code === this.config.mock.code6Digits || code === this.config.mock.code8Digits;
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
