export interface MockConfig {
  enableCodes: boolean;
  code6Digits: string;
  code8Digits: string;
}

export interface SmsMockConfig {
  enabled: boolean;
  useFixedCode: boolean;
}

export interface EmailMockConfig {
  enabled: boolean;
  useFixedCode: boolean;
}

export interface ValidaConfig {
  enable: boolean;
  logging: boolean;
  apiUrl: string;
  username: string;
  password: string;
  theme: string;
  webhookSecret: string;
  tokenTimeoutMin: number;
  enrollmentFlow: string;
  hideQr: boolean;
  disableFileUpload: boolean;
  allowIdRecovery: boolean;
}

export interface SandboxConfig {
  enable: boolean;
  userId: string;
  skipSecurity: boolean;
  sendPush: boolean;
  sendMail: boolean;
}

export interface EnvironmentConfig {
  nodeEnv: 'development' | 'staging' | 'production' | string;
  environmentName: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isStaging: boolean;
}

export interface AppConfig {
  mock: MockConfig;
  smsMock: SmsMockConfig;
  emailMock: EmailMockConfig;
  valida: ValidaConfig;
  sandbox: SandboxConfig;
  environment: EnvironmentConfig;
}
