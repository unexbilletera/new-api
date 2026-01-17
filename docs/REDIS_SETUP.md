# Como Configurar Redis

## Opção 1: Redis Local (Desenvolvimento)

### 1. Instalar Redis

**macOS (usando Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Docker (qualquer sistema):**
```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

### 2. Verificar se Redis está rodando

```bash
redis-cli ping
# Deve retornar: PONG
```

### 3. Configurar variável de ambiente

Adicione no seu arquivo `.env` ou `.env.development`:

```env
# Redis Local (sem senha, porta padrão)
WALLET_REDIS_URL=redis://localhost:6379/0
```

## Opção 2: Redis na Nuvem (Produção)

### AWS ElastiCache

1. Crie um cluster ElastiCache Redis na AWS
2. Obtenha o endpoint e porta
3. Configure no `.env.prod`:

```env
# Redis AWS ElastiCache (com senha)
WALLET_REDIS_URL=redis://sua-senha@seu-endpoint.xxxxx.cache.amazonaws.com:6379/0
```

### Redis Cloud / Upstash

1. Crie uma conta no serviço
2. Crie um banco Redis
3. Obtenha a URL de conexão
4. Configure no `.env.prod`:

```env
# Redis Cloud (formato completo)
WALLET_REDIS_URL=redis://default:sua-senha@seu-endpoint.upstash.io:6379/0
```

## Formato da URL Redis

O formato da URL é:
```
redis://[password@]host:port[/database]
```

**Exemplos:**
- `redis://localhost:6379/0` - Local sem senha, database 0
- `redis://mypassword@redis.example.com:6379/1` - Remoto com senha, database 1
- `redis://127.0.0.1:6379` - Local sem senha, database padrão (0)

## Verificar Configuração

### 1. Verificar se a variável está configurada

```bash
# No terminal
echo $WALLET_REDIS_URL

# Ou verifique no arquivo .env
cat .env | grep REDIS
```

### 2. Testar conexão Redis

```bash
# Conectar ao Redis
redis-cli

# Ou se tiver senha
redis-cli -a sua-senha

# Testar comandos
PING
# Deve retornar: PONG

SET test "hello"
GET test
# Deve retornar: "hello"
```

### 3. Verificar logs da aplicação

Quando a aplicação iniciar, verifique os logs:

- Se Redis estiver configurado: A aplicação usará Redis storage
- Se Redis não estiver configurado: A aplicação usará in-memory storage (fallback)

## Troubleshooting

### Erro: "Connection refused"

**Causa:** Redis não está rodando

**Solução:**
```bash
# Verificar se Redis está rodando
redis-cli ping

# Se não estiver, iniciar
# macOS
brew services start redis

# Linux
sudo systemctl start redis-server

# Docker
docker start redis
```

### Erro: "NOAUTH Authentication required"

**Causa:** Redis requer senha mas não foi fornecida

**Solução:** Adicione a senha na URL:
```env
WALLET_REDIS_URL=redis://sua-senha@localhost:6379/0
```

### Erro: "Connection timeout"

**Causa:** Redis não está acessível no host/porta especificados

**Solução:**
1. Verifique se o host e porta estão corretos
2. Verifique firewall/rede
3. Para serviços na nuvem, verifique se o IP está na whitelist

### Rate limiting não funciona com Redis

**Causa:** Aplicação pode estar usando in-memory storage

**Solução:**
1. Verifique se `WALLET_REDIS_URL` está configurada
2. Reinicie a aplicação após configurar
3. Verifique os logs para confirmar que está usando Redis

## Comandos Úteis Redis

```bash
# Conectar ao Redis
redis-cli

# Ver todas as chaves do throttler
KEYS throttler:*

# Ver valor de uma chave específica
GET throttler:default:ip-127.0.0.1

# Limpar todas as chaves do throttler (cuidado!)
KEYS throttler:* | xargs redis-cli DEL

# Ver informações do servidor
INFO

# Ver memória usada
INFO memory

# Limpar todo o banco (CUIDADO - apaga tudo!)
FLUSHDB
```

## Performance

- **In-memory storage**: Rápido, mas não compartilha entre instâncias
- **Redis storage**: Um pouco mais lento, mas compartilha entre múltiplas instâncias (essencial para produção)

Para produção com múltiplas instâncias da API, **Redis é obrigatório**.
