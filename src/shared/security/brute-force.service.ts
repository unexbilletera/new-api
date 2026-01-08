import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';
import { RateLimiterService } from './rate-limiter.service';
import { AccessLogService } from '../access-log/access-log.service';

interface BruteForceConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutDurationMs: number;
  notifyAfterAttempts?: number;
}

@Injectable()
export class BruteForceService {
  private readonly defaultConfig: BruteForceConfig = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    lockoutDurationMs: 30 * 60 * 1000,
    notifyAfterAttempts: 3,
  };

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private rateLimiter: RateLimiterService,
    private accessLogService: AccessLogService,
  ) {}

  async checkAttempt(
    identifier: string,
    ipAddress?: string,
    config?: Partial<BruteForceConfig>,
  ): Promise<{ allowed: boolean; remainingAttempts: number; lockoutUntil?: Date }> {
    const finalConfig = { ...this.defaultConfig, ...config };

    const identifierKey = `bf:identifier:${identifier}`;
    const identifierAllowed = await this.rateLimiter.check(identifierKey, {
      windowMs: finalConfig.windowMs,
      maxRequests: finalConfig.maxAttempts,
      blockDurationMs: finalConfig.lockoutDurationMs,
    });

    if (ipAddress) {
      const ipKey = `bf:ip:${ipAddress}`;
      const ipAllowed = await this.rateLimiter.check(ipKey, {
        windowMs: finalConfig.windowMs,
        maxRequests: finalConfig.maxAttempts * 2,
        blockDurationMs: finalConfig.lockoutDurationMs / 2,
      });

      if (!ipAllowed) {
        this.logger.warn(`Brute force blocked by IP: ${ipAddress} for identifier: ${identifier}`);
        return {
          allowed: false,
          remainingAttempts: 0,
          lockoutUntil: new Date(Date.now() + finalConfig.lockoutDurationMs / 2),
        };
      }
    }

    if (!identifierAllowed) {
      const recentFailures = await this.getRecentFailures(identifier, finalConfig.windowMs);
      
      if (recentFailures >= finalConfig.maxAttempts) {
        const lockoutUntil = new Date(Date.now() + finalConfig.lockoutDurationMs);
        
        this.logger.error(
          `Account locked due to brute force: ${identifier}`,
          undefined,
          {
            identifier,
            ipAddress,
            recentFailures,
            lockoutUntil,
          },
        );

        if (finalConfig.notifyAfterAttempts && recentFailures >= finalConfig.notifyAfterAttempts) {
          await this.notifySuspiciousActivity(identifier, ipAddress, recentFailures);
        }

        return {
          allowed: false,
          remainingAttempts: 0,
          lockoutUntil,
        };
      }
    }

    const remaining = await this.rateLimiter.getRemaining(identifierKey, {
      windowMs: finalConfig.windowMs,
      maxRequests: finalConfig.maxAttempts,
    });

    return {
      allowed: true,
      remainingAttempts: Math.max(0, remaining),
    };
  }

  async recordFailure(
    identifier: string,
    userId?: string,
    ipAddress?: string,
  ): Promise<void> {
    const identifierKey = `bf:identifier:${identifier}`;
    const config = {
      windowMs: this.defaultConfig.windowMs,
      maxRequests: this.defaultConfig.maxAttempts,
      blockDurationMs: this.defaultConfig.lockoutDurationMs,
    };

    await this.rateLimiter.check(identifierKey, config);

    this.logger.warn(`Failed login attempt recorded: ${identifier}`, {
      identifier,
      userId,
      ipAddress,
    });
  }

  async clearAttempts(identifier: string, ipAddress?: string): Promise<void> {
    await this.rateLimiter.reset(`bf:identifier:${identifier}`);
    if (ipAddress) {
      await this.rateLimiter.reset(`bf:ip:${ipAddress}`);
    }
    
    this.logger.debug(`Brute force attempts cleared: ${identifier}`);
  }

  private async getRecentFailures(identifier: string, windowMs: number): Promise<number> {
    try {
      const windowStart = new Date(Date.now() - windowMs);

      const user = await this.prisma.users.findFirst({
        where: {
          OR: [
            { email: identifier.toLowerCase() },
            { username: identifier.toLowerCase() },
          ],
        },
        select: { id: true },
      });

      if (!user) {
        return 0;
      }

      const count = await this.prisma.users_access_log.count({
        where: {
          userId: user.id,
          finalStatus: 'failure',
          createdAt: {
            gte: windowStart,
          },
        },
      });

      return count;
    } catch (error) {
      this.logger.error('Error getting recent failures', error instanceof Error ? error : undefined);
      return 0;
    }
  }

  private async notifySuspiciousActivity(
    identifier: string,
    ipAddress?: string,
    attemptCount?: number,
  ): Promise<void> {
    this.logger.error(
      'Suspicious login activity detected',
      undefined,
      {
        identifier,
        ipAddress,
        attemptCount,
        timestamp: new Date(),
      },
    );

  }
}
