import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
}

@Injectable()
export class RateLimiterService {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(private logger: LoggerService) {
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async check(key: string, config: RateLimitConfig): Promise<boolean> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (entry?.blockedUntil && entry.blockedUntil > now) {
      const remainingBlockTime = Math.ceil((entry.blockedUntil - now) / 1000);
      this.logger.warn(`Rate limit blocked: ${key} for ${remainingBlockTime}s`);
      return false;
    }

    if (entry?.blockedUntil && entry.blockedUntil <= now) {
      this.store.delete(key);
      return this.check(key, config);
    }

    if (!entry || entry.resetTime <= now) {
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    entry.count++;

    if (entry.count > config.maxRequests) {
      if (config.blockDurationMs) {
        entry.blockedUntil = now + config.blockDurationMs;
        this.logger.warn(
          `Rate limit exceeded and blocked: ${key} for ${config.blockDurationMs}ms`,
        );
      } else {
        this.logger.warn(
          `Rate limit exceeded: ${key} (${entry.count}/${config.maxRequests})`,
        );
      }
      return false;
    }

    return true;
  }

  async getRemaining(key: string, config: RateLimitConfig): Promise<number> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      return config.maxRequests;
    }

    if (entry.blockedUntil && entry.blockedUntil > now) {
      return 0;
    }

    if (entry.resetTime <= now) {
      return config.maxRequests;
    }

    return Math.max(0, config.maxRequests - entry.count);
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (
        entry.resetTime <= now &&
        (!entry.blockedUntil || entry.blockedUntil <= now)
      ) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(
        `Rate limiter cleanup: removed ${cleaned} expired entries`,
      );
    }
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}
