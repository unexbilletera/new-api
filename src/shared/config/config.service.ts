import { Injectable } from '@nestjs/common';

/**
 * Service de configuração
 * Mapeia variáveis de ambiente WALLET_* para nomes mais padrão
 */
@Injectable()
export class ConfigService {
  /**
   * Database URL (usado pelo Prisma)
   * Prisma usa WALLET_MYSQL_URL diretamente do schema.prisma
   */
  get databaseUrl(): string {
    return process.env.WALLET_MYSQL_URL || '';
  }

  /**
   * JWT Secret
   */
  get jwtSecret(): string {
    return (
      process.env.JWT_SECRET ||
      process.env.WALLET_TOKEN_SECRET ||
      'default-secret-change-in-production'
    );
  }

  /**
   * JWT Expires In
   */
  get jwtExpiresIn(): string {
    return (
      process.env.JWT_EXPIRES_IN || process.env.WALLET_TOKEN_EXPIRE || '24h'
    );
  }

  /**
   * Server Port
   */
  get serverPort(): number {
    return parseInt(
      process.env.PORT || process.env.WALLET_SERVER_PORT || '3000',
      10,
    );
  }

  /**
   * Server URL
   */
  get serverUrl(): string {
    return (
      process.env.SERVER_URL ||
      process.env.WALLET_SERVER_URL ||
      'http://localhost:3000'
    );
  }

  /**
   * Redis URL
   */
  get redisUrl(): string {
    return process.env.REDIS_URL || process.env.WALLET_REDIS_URL || '';
  }

  /**
   * Node Environment
   */
  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  /**
   * Verifica se está em produção
   */
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  /**
   * Verifica se está em sandbox
   */
  get isSandbox(): boolean {
    return this.nodeEnv === 'sandbox';
  }

  /**
   * Verifica se está em desenvolvimento
   */
  get isDevelopment(): boolean {
    return (
      this.nodeEnv === 'development' || (!this.isProduction && !this.isSandbox)
    );
  }

  /**
   * Obtém qualquer variável de ambiente
   */
  get(key: string, defaultValue?: string): string | undefined {
    return process.env[key] || defaultValue;
  }
}
