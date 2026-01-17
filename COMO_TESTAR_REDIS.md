# Como Testar Conexão Redis

## Opção 1: Script Automatizado (Recomendado)

Criei um script de teste em `scripts/test-redis-connection.ts`. Para executar:

```bash
cd new-api
npx ts-node scripts/test-redis-connection.ts
```

O script:
- ✅ Carrega as variáveis de ambiente automaticamente
- ✅ Testa a conexão com Redis
- ✅ Testa operações básicas (SET, GET, DEL)
- ✅ Testa operações do Throttler
- ✅ Mostra informações detalhadas de erro

## Opção 2: Usando redis-cli (Se tiver instalado)

### Local (sem senha):
```bash
redis-cli ping
# Deve retornar: PONG
```

### Com senha:
```bash
redis-cli -a sua-senha ping
```

### ElastiCache (via SSH tunnel):
Se precisar testar ElastiCache da AWS localmente, você pode usar um SSH tunnel:

```bash
# Criar tunnel SSH (exemplo)
ssh -i ./pem/UNEX-PROD-PEM.pem -L 6379:seu-endpoint.cache.amazonaws.com:6379 ubuntu@seu-servidor-ec2

# Em outro terminal
redis-cli -h localhost -p 6379 -a sua-senha ping
```

## Opção 3: Testar via Código Node.js

Crie um arquivo `test-redis-simple.js`:

```javascript
const Redis = require('ioredis');

// Substitua pela sua URL
const redisUrl = 'redis://localhost:6379/0';
// Ou para ElastiCache: 'rediss://senha@endpoint.cache.amazonaws.com:6379/0'

const match = redisUrl.match(/^rediss?:\/\/(?:([^@]+)@)?([^:]+):(\d+)(?:\/(\d+))?$/);
const [, password, host, port, db] = match;
const useTLS = redisUrl.startsWith('rediss://');

const redis = new Redis({
  host,
  port: parseInt(port),
  password: password || undefined,
  db: db ? parseInt(db) : 0,
  tls: useTLS ? {} : undefined,
});

redis.ping()
  .then(result => {
    console.log('✅ Conexão OK!', result);
    return redis.set('test', 'OK');
  })
  .then(() => redis.get('test'))
  .then(value => {
    console.log('✅ GET:', value);
    return redis.del('test');
  })
  .then(() => {
    console.log('✅ Teste completo!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  });
```

Execute:
```bash
node test-redis-simple.js
```

## Sua Configuração Atual

Vejo que você tem duas URLs configuradas no `env.prod`:

1. **Linha 16**: `redis://unex:unex@unex-redis/unex` (parece ser Docker/local)
2. **Linha 301**: `rediss://:tobjr9cv1wrg7vsav7ktzre0@clustercfg.redis-cache-api.zsbm8t.use2.cache.amazonaws.com:6379/0` (ElastiCache AWS com TLS)

A linha 301 está usando `rediss://` (com SSL/TLS), que é comum para ElastiCache.

## Testar a URL do ElastiCache

Para testar a URL do ElastiCache (linha 301), você precisa:

1. **Estar na mesma VPC da AWS** (se testar de fora da AWS)
2. **Ou usar um servidor EC2** na mesma VPC
3. **Ou usar um tunnel SSH** como mostrado acima

## O que o código já suporta

✅ O código já foi atualizado para suportar:
- `redis://` (sem SSL)
- `rediss://` (com SSL/TLS) - necessário para ElastiCache
- Senha na URL
- Database específico

## Próximos Passos

1. Execute o script de teste: `npx ts-node scripts/test-redis-connection.ts`
2. Se funcionar, o Redis está pronto para uso
3. Se não funcionar, verifique os erros e siga as sugestões
