import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

@Injectable()
export class ThrottlerRedisStorage implements ThrottlerStorage {
  private redis: Redis;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    try {
      if (this.redis.status !== 'ready') {
        try {
          await this.redis.connect();
        } catch {
          return {
            totalHits: 1,
            timeToExpire: ttl,
            isBlocked: false,
            timeToBlockExpire: 0,
          };
        }
      }

      const recordKey = `throttler:${throttlerName}:${key}`;
      const blockKey = `throttler:${throttlerName}:block:${key}`;

      const isBlocked = await this.redis.exists(blockKey);
      const blockExpireTime = isBlocked ? await this.redis.ttl(blockKey) : 0;

      if (isBlocked) {
        const currentHits = await this.redis.get(recordKey);
        return {
          totalHits: parseInt(currentHits || '0', 10),
          timeToExpire: ttl,
          isBlocked: true,
          timeToBlockExpire: blockExpireTime * 1000,
        };
      }

      const multi = this.redis.multi();
      multi.incr(recordKey);
      multi.pexpire(recordKey, ttl);
      const results = await multi.exec();

      const totalHits = results?.[0]?.[1] as number;
      const currentTtl = await this.redis.pttl(recordKey);

      if (totalHits > limit) {
        await this.redis.setex(blockKey, Math.ceil(blockDuration / 1000), '1');
        return {
          totalHits,
          timeToExpire: currentTtl > 0 ? currentTtl : ttl,
          isBlocked: true,
          timeToBlockExpire: blockDuration,
        };
      }

      return {
        totalHits,
        timeToExpire: currentTtl > 0 ? currentTtl : ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } catch {
      return {
        totalHits: 1,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }

  async get(key: string): Promise<ThrottlerStorageRecord | undefined> {
    try {
      const value = await this.redis.get(key);
      if (!value) return undefined;

      const ttl = await this.redis.pttl(key);
      return {
        totalHits: parseInt(value, 10),
        timeToExpire: ttl > 0 ? ttl : 0,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } catch {
      return undefined;
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch {
      // Silently fail
    }
  }
}
