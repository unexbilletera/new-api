import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '../../../generated/prisma';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PrismaOptimizedService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 100;
  private readonly queryTimeoutMs = 30000;
  private readonly connectionPoolConfig = {
    connection_limit: 10,
    pool_timeout: 10,
  };

  constructor(private logger: LoggerService) {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'stdout',
          level: process.env.NODE_ENV === 'development' ? 'warn' : 'error',
        },
      ],
      errorFormat: 'pretty',
    });

    this.setupQueryLogger();
    this.setupErrorHandling();
  }

  private buildConnectionString(): string {
    const baseUrl =
      process.env.WALLET_MYSQL_URL || process.env.DATABASE_URL || '';

    if (!baseUrl) return '';

    const url = new URL(baseUrl);
    url.searchParams.set(
      'connection_limit',
      this.connectionPoolConfig.connection_limit.toString(),
    );
    url.searchParams.set(
      'pool_timeout',
      this.connectionPoolConfig.pool_timeout.toString(),
    );
    url.searchParams.set('max_idle_time', '60');
    url.searchParams.set('connect_timeout', '10');

    return url.toString();
  }

  async executeWithRetry<T>(
    queryFn: () => Promise<T>,
    retries: number = this.maxRetries,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return (await Promise.race([
          queryFn(),
          this.createTimeout(this.queryTimeoutMs),
        ])) as T;
      } catch (error: any) {
        lastError = error;

        if (!this.isRetryableError(error)) {
          throw error;
        }

        if (this.isDeadlockError(error)) {
          const delay = this.calculateBackoff(attempt);
          this.logger.warn(
            `Deadlock detected, retrying after ${delay}ms (attempt ${attempt + 1}/${retries + 1})`,
          );

          await this.sleep(delay);
          continue;
        }

        if (this.isConnectionError(error)) {
          const delay = this.calculateBackoff(attempt);
          this.logger.warn(
            `Connection error, retrying after ${delay}ms (attempt ${attempt + 1}/${retries + 1})`,
          );

          await this.sleep(delay);
          continue;
        }

        if (attempt < retries) {
          const delay = this.calculateBackoff(attempt);
          this.logger.warn(
            `Query failed, retrying after ${delay}ms (attempt ${attempt + 1}/${retries + 1})`,
          );

          await this.sleep(delay);
          continue;
        }

        throw error;
      }
    }

    throw lastError || new Error('Query execution failed');
  }

  async executeTransaction<T>(
    transactionFn: (tx: Prisma.TransactionClient) => Promise<T>,
    isolationLevel:
      | 'ReadUncommitted'
      | 'ReadCommitted'
      | 'RepeatableRead'
      | 'Serializable' = 'ReadCommitted',
  ): Promise<T> {
    return this.executeWithRetry(async () => {
      return this.$transaction(transactionFn, {
        maxWait: 10000,
        timeout: this.queryTimeoutMs,
        isolationLevel,
      });
    });
  }

  private isRetryableError(error: any): boolean {
    if (!error) return false;

    const errorCode = error.code;
    const errorMessage = error.message?.toLowerCase() || '';

    if (errorCode === '1213' || errorCode === 'ER_LOCK_DEADLOCK') {
      return true;
    }

    if (errorCode === '1205' || errorCode === 'ER_LOCK_WAIT_TIMEOUT') {
      return true;
    }

    if (this.isConnectionError(error)) {
      return true;
    }

    if (
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout')
    ) {
      return true;
    }

    return false;
  }

  private isDeadlockError(error: any): boolean {
    const errorCode = error.code;
    const errorMessage = error.message?.toLowerCase() || '';

    return (
      errorCode === '1213' ||
      errorCode === 'ER_LOCK_DEADLOCK' ||
      errorMessage.includes('deadlock')
    );
  }

  private isConnectionError(error: any): boolean {
    const errorCode = error.code;
    const errorMessage = error.message?.toLowerCase() || '';

    return (
      errorCode === 'ECONNREFUSED' ||
      errorCode === 'ETIMEDOUT' ||
      errorCode === 'ENOTFOUND' ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('network')
    );
  }

  private calculateBackoff(attempt: number): number {
    const baseDelay = this.retryDelayMs;
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 100;

    return Math.min(exponentialDelay + jitter, 5000);
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Query timeout after ${ms}ms`));
      }, ms);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private setupQueryLogger(): void {
    this.$on('query' as never, (e: Prisma.QueryEvent) => {
      const duration = e.duration ? `${e.duration}ms` : '';

      if (e.duration && e.duration > 1000) {
        this.logger.warn('Slow query detected', {
          query: e.query.substring(0, 200),
          duration: e.duration,
          params: e.params,
        });
      } else {
        this.logger.debug(`[SQL] ${e.query.substring(0, 100)} ${duration}`);
      }
    });
  }

  private setupErrorHandling(): void {
    this.$on('error' as never, (e: Prisma.LogEvent) => {
      this.logger.error('Prisma error', undefined, {
        message: e.message,
        target: e.target,
      });
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.info('Prisma connected with optimized settings');
    } catch (error) {
      this.logger.error(
        'Failed to connect to database',
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.info('Prisma disconnected');
  }
}
