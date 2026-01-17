import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

// Interface ThrottlerStorageRecord não é exportada diretamente do index
// Por isso importamos do caminho específico

/**
 * Custom Redis storage para Throttler
 * Implementa a interface ThrottlerStorage usando ioredis
 */
@Injectable()
export class ThrottlerRedisStorage implements ThrottlerStorage {
  private redis: Redis;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  /**
   * Incrementa o contador de requisições para uma chave
   * Retorna informações sobre o estado atual do rate limiting
   */
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    try {
      // Verificar se está conectado, se não estiver, tentar conectar
      if (this.redis.status !== 'ready') {
        try {
          await this.redis.connect();
        } catch (connectError) {
          // Se não conseguir conectar, permitir requisição (fallback)
          return {
            totalHits: 1,
            timeToExpire: ttl,
            isBlocked: false,
            timeToBlockExpire: 0,
          };
        }
      }

      const now = Date.now();
      const expiresAt = now + ttl;
      const blockExpiresAt = now + blockDuration;

      // Buscar registro atual
      const recordKey = `throttler:${throttlerName}:${key}`;
      const blockKey = `throttler:${throttlerName}:block:${key}`;

      // Verificar se está bloqueado
      const isBlocked = await this.redis.exists(blockKey);
      const blockExpireTime = isBlocked
        ? await this.redis.ttl(blockKey)
        : 0;

      if (isBlocked && blockExpireTime > 0) {
        return {
          totalHits: limit + 1, // Indica que excedeu o limite
          timeToExpire: 0,
          isBlocked: true,
          timeToBlockExpire: blockExpireTime * 1000, // Converter para ms
        };
      }

      // Incrementar contador
      const totalHits = await this.redis.incr(recordKey);

      // Se for a primeira requisição, definir TTL
      if (totalHits === 1) {
        await this.redis.pexpire(recordKey, ttl);
      }

      // Verificar se excedeu o limite
      if (totalHits > limit) {
        // Bloquear por blockDuration
        await this.redis.setex(blockKey, Math.ceil(blockDuration / 1000), '1');

        return {
          totalHits,
          timeToExpire: 0,
          isBlocked: true,
          timeToBlockExpire: blockDuration,
        };
      }

      // Obter TTL restante
      const timeToExpire = await this.redis.pttl(recordKey);

      return {
        totalHits,
        timeToExpire: timeToExpire > 0 ? timeToExpire : 0,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } catch (error) {
      // Se Redis falhar, retornar como se não houvesse limite (permitir requisição)
      // Isso evita que a aplicação quebre se Redis não estiver disponível
      // Em produção, Redis deve estar disponível, mas em desenvolvimento pode não estar
      // Log apenas uma vez por minuto para não poluir
      return {
        totalHits: 1,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }
}
