# Rate Limiting com Redis

## Status Atual

O rate limiting está configurado e funcionando com **in-memory storage** por padrão.

## Configuração Atual

- **Endpoint `/transactions/pix/cronos/create`**: 5 requisições por minuto
- **Endpoint `/transactions/pix/cronos/confirm`**: 10 requisições por minuto
- **Padrão global**: 10 requisições por minuto

## Como Configurar Redis

O Redis já está configurado automaticamente! Se a variável `WALLET_REDIS_URL` estiver configurada, o sistema usa Redis. Caso contrário, usa in-memory storage.

### 1. Instalar pacote ioredis (já instalado)

O pacote `ioredis` já está instalado. Não é necessário instalar nenhum pacote adicional.

### 2. Configuração automática

O `app.module.ts` já está configurado para usar Redis automaticamente quando a variável `WALLET_REDIS_URL` estiver presente. A implementação customizada está em `src/shared/throttler/throttler-redis.storage.ts`.

### 3. Configurar variável de ambiente

Certifique-se de que a variável `WALLET_REDIS_URL` está configurada no seu `.env`:

```env
WALLET_REDIS_URL=redis://[password@]host:port[/database]
# Exemplo:
# WALLET_REDIS_URL=redis://localhost:6379/0
# WALLET_REDIS_URL=redis://mypassword@redis.example.com:6379/0
```

## Como Funciona

- O rate limiting é aplicado **por IP** e **por usuário** (quando autenticado)
- Quando o limite é excedido, retorna status `429 Too Many Requests`
- Os headers de resposta incluem:
  - `X-RateLimit-Limit`: Limite de requisições
  - `X-RateLimit-Remaining`: Requisições restantes
  - `X-RateLimit-Reset`: Timestamp de reset

## Testando

Para testar o rate limiting, faça múltiplas requisições rapidamente:

```bash
# Testar endpoint create (limite: 5/min)
for i in {1..6}; do
  curl -X POST http://localhost:3000/transactions/pix/cronos/create \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"sourceAccountId":"...","amount":100,"targetKeyType":"cpf","targetKeyValue":"12345678900"}'
  echo ""
done

# A 6ª requisição deve retornar 429
```

## Notas

- Com **in-memory storage**: Rate limiting funciona apenas em uma única instância
- Com **Redis storage**: Rate limiting funciona em múltiplas instâncias (produção)
- Os limites podem ser ajustados nos decorators `@Throttle()` nos controllers
