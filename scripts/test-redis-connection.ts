/**
 * Script para testar conexão com Redis
 * Execute com: npx ts-node scripts/test-redis-connection.ts
 */

import Redis from 'ioredis';
import { loadEnvironmentFile } from '../src/shared/config/env-loader';

// Carregar variáveis de ambiente
// Se NODE_ENV não estiver definido, usar 'production' para carregar env.prod
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Preservar override via env antes de carregar o arquivo
const preloadedRedisUrl = process.env.REDIS_URL || process.env.WALLET_REDIS_URL;

loadEnvironmentFile();

// Priorizar override do terminal
const redisUrl =
  preloadedRedisUrl ||
  process.env.REDIS_URL ||
  process.env.WALLET_REDIS_URL ||
  '';

async function testRedisConnection() {
  console.log('🔍 Testando conexão com Redis...\n');

  if (!redisUrl) {
    console.error('❌ Erro: WALLET_REDIS_URL não está configurada');
    console.log('\nConfigure no .env:');
    console.log('WALLET_REDIS_URL=redis://localhost:6379/0');
    process.exit(1);
  }

  console.log(`📍 URL Redis: ${redisUrl.replace(/\/\/[^@]*@/, '//***:***@')}`);

  // Parse Redis URL (suporta redis:// e rediss://)
  // Aceita URLs com ou sem porta (porta padrão: 6379)
  // Formato: redis://[password@]host[:port][/database]
  const redisMatch = redisUrl.match(
    /^rediss?:\/\/(?:([^@]+)@)?([^:/]+)(?::(\d+))?(?:\/(\d+))?$/,
  );

  if (!redisMatch) {
    console.error('❌ Erro: URL Redis inválida');
    console.log(
      'Formato esperado: redis://[password@]host[:port][/database] ou rediss://[password@]host[:port][/database]',
    );
    console.log(`   URL recebida: ${redisUrl}`);
    process.exit(1);
  }

  const [, authPart, host, port, db] = redisMatch;
  let username: string | undefined;
  let password: string | undefined;

  if (authPart) {
    if (authPart.includes(':')) {
      const [user, pass] = authPart.split(':', 2);
      username = user || undefined;
      password = pass || undefined;
    } else {
      password = authPart;
    }
  }
  const useTLS = redisUrl.startsWith('rediss://');
  const defaultPort = '6379';

  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port || defaultPort} ${port ? '' : '(padrão)'}`);
  console.log(`   Database: ${db || '0'}`);
  console.log(`   TLS/SSL: ${useTLS ? 'Sim' : 'Não'}`);
  console.log(`   Username: ${username ? '***' : 'não configurado'}`);
  console.log(`   Password: ${password ? '***' : 'não configurada'}\n`);

  const redisClient = new Redis({
    host: host || 'localhost',
    port: parseInt(port || defaultPort, 10),
    username: username || undefined,
    password: password || undefined,
    db: db ? parseInt(db, 10) : 0,
    tls: useTLS
      ? {
          // Para túnel local (127.0.0.1), aceitar mismatch de certificado
          rejectUnauthorized: false,
        }
      : undefined,
    retryStrategy: () => null, // Não tentar reconectar no teste
    maxRetriesPerRequest: 1,
    connectTimeout: 10000,
    enableOfflineQueue: false,
    lazyConnect: true,
  });

  try {
    console.log('⏳ Tentando conectar...');

    // Testar conexão com timeout explícito
    const withTimeout = async <T>(
      promise: Promise<T>,
      ms: number,
      errorMessage: string,
    ): Promise<T> =>
      await Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(errorMessage)), ms),
        ),
      ]);

    // Conectar explicitamente antes de enviar comandos (enableOfflineQueue=false)
    await withTimeout(
      redisClient.connect(),
      10000,
      'Timeout ao conectar no Redis (10s)',
    );

    await withTimeout(
      redisClient.ping(),
      5000,
      'Timeout ao executar PING no Redis (5s)',
    );
    console.log('✅ Conexão bem-sucedida! Redis está respondendo.\n');

    // Testar operações básicas
    console.log('🧪 Testando operações básicas...');

    // SET
    await redisClient.set('test:connection', 'OK', 'EX', 10);
    console.log('   ✅ SET: OK');

    // GET
    const value = await redisClient.get('test:connection');
    console.log(`   ✅ GET: ${value}`);

    // Verificar se é o valor esperado
    if (value === 'OK') {
      console.log('   ✅ Valor correto retornado');
    } else {
      console.log('   ⚠️  Valor inesperado');
    }

    // Limpar teste
    await redisClient.del('test:connection');
    console.log('   ✅ DEL: Limpeza concluída\n');

    // Testar operações do Throttler
    console.log('🧪 Testando operações do Throttler...');

    const testKey = 'throttler:test:test-key';
    await redisClient.setex(testKey, 60, '1');
    console.log('   ✅ SETEX: OK');

    const exists = await redisClient.exists(testKey);
    console.log(`   ✅ EXISTS: ${exists === 1 ? 'OK' : 'NÃO ENCONTRADO'}`);

    const ttl = await redisClient.ttl(testKey);
    console.log(`   ✅ TTL: ${ttl} segundos`);

    // Limpar
    await redisClient.del(testKey);
    console.log('   ✅ Limpeza concluída\n');

    console.log(
      '🎉 Todos os testes passaram! Redis está funcionando corretamente.\n',
    );
    console.log('💡 A aplicação pode usar Redis para rate limiting.');

    await redisClient.quit();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao conectar ao Redis:');
    if (error instanceof Error) {
      console.error(`   Mensagem: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error(`   Erro: ${error}`);
    }

    console.error('\n🔧 Possíveis soluções:');
    console.error('   1. Verifique se Redis está rodando');
    console.error('   2. Verifique se o host e porta estão corretos');
    console.error('   3. Verifique se a senha está correta (se necessário)');
    console.error(
      '   4. Verifique firewall/rede (para ElastiCache, verifique Security Groups)',
    );
    console.error('   5. Para ElastiCache, verifique se está na mesma VPC\n');

    try {
      await redisClient.quit();
    } catch {
      // Ignorar erro ao fechar conexão já encerrada
    }
    process.exit(1);
  }
}

void testRedisConnection();
