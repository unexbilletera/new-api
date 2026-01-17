# Segurança PIX Cronos - Documentação Completa

Este documento descreve todas as medidas de segurança implementadas para as transações PIX via Cronos, incluindo como testar cada uma delas.

---

## 📋 Índice

1. [Validação de Saldo / Limite Antes da Confirmação](#1-validação-de-saldo--limite-antes-da-confirmação)
2. [Reserva de Saldo no Create / Travas Transacionais](#2-reserva-de-saldo-no-create--travas-transacionais)
3. [Limites de Uso / Anti-Fraude Simples](#3-limites-de-uso--anti-fraude-simples)
4. [Detecção de Duplicidade de Transferência](#4-detecção-de-duplicidade-de-transferência)
5. [Rate Limiting / Proteção de Endpoint](#5-rate-limiting--proteção-de-endpoint)
6. [Validações Extras de Entrada Avançadas](#6-validações-extras-de-entrada-avançadas)
7. [Webhook Cronos](#7-webhook-cronos)

---

## 1. Validação de Saldo / Limite Antes da Confirmação

### O que faz

Valida se o usuário tem saldo suficiente e se os limites configurados permitem a transação antes de confirmá-la. As validações incluem:

- **Saldo disponível**: Verifica se há saldo suficiente (considerando transações pendentes)
- **Limite máximo por transação**: Valida se o valor não excede o limite configurado no perfil de spending limits
- **Limite diário**: Verifica se o limite diário não foi excedido
- **Limite de contagem diária**: Verifica se o número máximo de transações por dia não foi excedido
- **Limite de velocidade**: Verifica se não há muitas transações em um período curto (anti-fraude)

### Onde está implementado

- **Service**: `src/secure/transactions/cronos/pix-cronos/services/pix-cronos-validation.service.ts`
- **Handler**: `src/worker/handlers/pix-cronos.handler.ts` (valida antes de confirmar)

### Como testar

#### Teste 1: Saldo Insuficiente

```bash
# 1. Criar transação com valor maior que o saldo disponível
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 10000.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "12345678900"
  }'

# Esperado: Erro 400 com código TRANSACTIONS_INSUFFICIENT_BALANCE
```

#### Teste 2: Limite Máximo por Transação Excedido

```bash
# 1. Verificar limite configurado no perfil de spending limits
# 2. Criar transação com valor acima do limite
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 5000.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "12345678900"
  }'

# Esperado: Erro 400 com código TRANSACTIONS_MAX_AMOUNT_PER_TRANSACTION_EXCEEDED
```

#### Teste 3: Limite Diário Excedido

```bash
# 1. Fazer várias transações até atingir o limite diário
# 2. Tentar criar mais uma transação
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 100.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "12345678900"
  }'

# Esperado: Erro 400 com código TRANSACTIONS_MAX_AMOUNT_PER_DAY_EXCEEDED
```

---

## 2. Reserva de Saldo no Create / Travas Transacionais

### O que faz

Quando uma transação é criada, o sistema:

1. **Bloqueia a conta** usando `SELECT FOR UPDATE` (lock transacional)
2. **Calcula saldo disponível** subtraindo transações pendentes do saldo total
3. **Valida saldo suficiente** antes de criar a transação
4. **Cancela transações pendentes antigas** quando uma nova é criada (evita saldo bloqueado indefinidamente)
5. **Cria a transação** dentro de uma transação atômica

Isso previne:
- Duas confirmações concorrentes estourarem o saldo
- Outro fluxo consumir o mesmo saldo antes da confirmação
- Saldo ficar bloqueado por transações abandonadas

### Onde está implementado

- **Model**: `src/secure/transactions/cronos/pix-cronos/models/pix-cronos-transaction.model.ts`
- **Método**: `createWithLock()`

### Como testar

#### Teste 1: Transação Concorrente (Race Condition)

```bash
# Terminal 1: Criar transação
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 500.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "12345678900"
  }'

# Terminal 2: Imediatamente criar outra transação (antes da primeira confirmar)
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 500.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "12345678900"
  }'

# Esperado: 
# - Primeira transação: Sucesso
# - Segunda transação: Erro 400 TRANSACTIONS_INSUFFICIENT_BALANCE (se saldo não for suficiente)
# OU: Primeira transação pendente é cancelada e segunda é criada
```

#### Teste 2: Cancelamento de Transações Pendentes

```bash
# 1. Criar transação pendente (não confirmar)
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 100.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "12345678900"
  }'

# 2. Verificar no banco: transação com status 'pending'

# 3. Criar nova transação
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 200.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "12345678900"
  }'

# Esperado: 
# - Transação pendente anterior é cancelada (status = 'cancel')
# - Nova transação é criada com sucesso
```

#### Teste 3: Saldo Disponível Considerando Pendentes

```bash
# 1. Criar transação pendente de 500.00
# 2. Saldo total: 1000.00
# 3. Tentar criar transação de 600.00

# Esperado: Erro 400 TRANSACTIONS_INSUFFICIENT_BALANCE
# Saldo disponível = 1000.00 - 500.00 (pendente) = 500.00
```

---

## 3. Limites de Uso / Anti-Fraude Simples

### O que faz

Implementa limites de uso para prevenir fraude:

1. **Limite de contagem diária**: Máximo de transações por dia (configurado em `spending_limit_profiles.limitsBr.pix.maxCountDaily`)
2. **Limite de velocidade**: Máximo de 3 transações em 60 segundos (anti-fraude)

### Onde está implementado

- **Service**: `src/secure/transactions/cronos/pix-cronos/services/pix-cronos-validation.service.ts`
- **Métodos**: `validateTransactionCountDaily()`, `validateTransactionVelocity()`

### Como testar

#### Teste 1: Limite de Contagem Diária

```bash
# 1. Verificar limite configurado (ex: maxCountDaily = 5)
# 2. Criar 5 transações com sucesso
# 3. Tentar criar a 6ª transação

curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 10.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "12345678900"
  }'

# Esperado: Erro 400 TRANSACTIONS_MAX_COUNT_PER_DAY_EXCEEDED
```

#### Teste 2: Limite de Velocidade (3 transações em 60 segundos)

```bash
# Criar 3 transações rapidamente (em menos de 60 segundos)
for i in {1..3}; do
  curl -X POST http://localhost:3000/transactions/pix/cronos/create \
    -H "Authorization: Bearer SEU_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"sourceAccountId\": \"uuid-da-conta\",
      \"amount\": 10.00,
      \"targetKeyType\": \"cpf\",
      \"targetKeyValue\": \"12345678900\"
    }"
  sleep 1
done

# Tentar criar a 4ª transação imediatamente
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 10.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "12345678900"
  }'

# Esperado: Erro 400 TRANSACTIONS_VELOCITY_LIMIT_EXCEEDED
```

---

## 4. Detecção de Duplicidade de Transferência

### O que faz

Detecta tentativas de criar transações duplicadas:

1. **Verificação por EndToEnd**: Busca transações com mesmo `userId`, `sourceAccountId`, `amount`, `reference` e status `pending/process/confirm` dentro de 30 segundos
2. **Chave de Idempotência**: Se `idempotencyKey` for fornecido, verifica se já existe transação com essa chave
3. **Janela de tempo estendida**: Verifica duplicatas em status `confirm` também (não apenas `pending`)

### Onde está implementado

- **Model**: `src/secure/transactions/cronos/pix-cronos/models/pix-cronos-transaction.model.ts`
- **Método**: `createWithLock()` (dentro da validação de duplicidade)

### Como testar

#### Teste 1: Duplicata por Mesmos Dados (30 segundos)

```bash
# 1. Criar primeira transação
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 100.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "12345678900",
    "description": "Teste duplicata"
  }'

# 2. Imediatamente criar transação idêntica (mesmos dados)
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 100.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "12345678900",
    "description": "Teste duplicata"
  }'

# Esperado: Erro 400 TRANSACTIONS_DUPLICATE_TRANSACTION
```

#### Teste 2: Chave de Idempotência

```bash
# 1. Criar transação com idempotencyKey
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 100.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "12345678900",
    "idempotencyKey": "unique-key-123"
  }'

# 2. Tentar criar novamente com mesma idempotencyKey (mesmo que dados diferentes)
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 200.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "98765432100",
    "idempotencyKey": "unique-key-123"
  }'

# Esperado: Erro 400 TRANSACTIONS_DUPLICATE_TRANSACTION
```

#### Teste 3: Duplicata Após Confirmação

```bash
# 1. Criar e confirmar transação
# 2. Tentar criar transação idêntica novamente (dentro de 30 segundos)

# Esperado: Erro 400 TRANSACTIONS_DUPLICATE_TRANSACTION
# (mesmo que a primeira já esteja confirmada)
```

---

## 5. Rate Limiting / Proteção de Endpoint

### O que faz

Limita o número de requisições por tempo para prevenir abuso:

- **Endpoint `/create`**: Máximo 5 requisições por minuto
- **Endpoint `/confirm`**: Máximo 10 requisições por minuto
- **Storage**: Redis (se configurado) ou in-memory (fallback)

### Onde está implementado

- **Controller**: `src/secure/transactions/cronos/pix-cronos/controllers/pix-cronos.controller.ts`
- **Module**: `src/app.module.ts` (configuração do ThrottlerModule)
- **Storage**: `src/shared/throttler/throttler-redis.storage.ts`

### Como testar

#### Teste 1: Rate Limit no Endpoint Create

```bash
# Criar 6 requisições rapidamente (limite é 5/min)
for i in {1..6}; do
  curl -X POST http://localhost:3000/transactions/pix/cronos/create \
    -H "Authorization: Bearer SEU_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"sourceAccountId\": \"uuid-da-conta\",
      \"amount\": 10.00,
      \"targetKeyType\": \"cpf\",
      \"targetKeyValue\": \"12345678900\"
    }"
  echo "Requisição $i"
  sleep 1
done

# Esperado:
# - Requisições 1-5: Sucesso (200)
# - Requisição 6: Erro 429 Too Many Requests
```

#### Teste 2: Rate Limit no Endpoint Confirm

```bash
# Criar 11 requisições rapidamente (limite é 10/min)
for i in {1..11}; do
  curl -X POST http://localhost:3000/transactions/pix/cronos/confirm \
    -H "Authorization: Bearer SEU_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"transactionId\": \"uuid-da-transacao\"
    }"
  echo "Requisição $i"
  sleep 1
done

# Esperado:
# - Requisições 1-10: Sucesso (200)
# - Requisição 11: Erro 429 Too Many Requests
```

#### Teste 3: Verificar Headers de Rate Limit

```bash
curl -i -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 10.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "12345678900"
  }'

# Verificar headers na resposta:
# X-RateLimit-Limit: 5
# X-RateLimit-Remaining: 4
# X-RateLimit-Reset: <timestamp>
```

---

## 6. Validações Extras de Entrada Avançadas

### O que faz

Valida o formato das chaves PIX antes de processar:

- **CPF**: 11 dígitos com validação de dígitos verificadores
- **CNPJ**: 14 dígitos com validação de dígitos verificadores
- **EMAIL**: Formato válido de email (RFC 5322, máximo 77 caracteres)
- **PHONE**: Formato brasileiro válido (+55XX..., 55XX..., ou XX...)
- **EVP**: Formato UUID válido

### Onde está implementado

- **Validator**: `src/shared/validators/pix-key.validator.ts`
- **DTO Validator**: `src/secure/transactions/cronos/pix-cronos/validators/pix-key-format.validator.ts`
- **Service**: `src/secure/transactions/cronos/pix-cronos/services/pix-cronos.service.ts` (validação dupla)

### Como testar

#### Teste 1: CPF Inválido

```bash
# CPF com dígitos verificadores inválidos
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 100.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "12345678900"
  }'

# Esperado: Erro 400 TRANSACTIONS_INVALID_PIX_KEY_CPF
```

#### Teste 2: CPF Válido

```bash
# CPF válido (exemplo: 11144477735)
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 100.00,
    "targetKeyType": "cpf",
    "targetKeyValue": "11144477735"
  }'

# Esperado: Sucesso (se outros dados estiverem corretos)
```

#### Teste 3: CNPJ Inválido

```bash
# CNPJ com dígitos verificadores inválidos
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 100.00,
    "targetKeyType": "cnpj",
    "targetKeyValue": "12345678000190"
  }'

# Esperado: Erro 400 TRANSACTIONS_INVALID_PIX_KEY_CNPJ
```

#### Teste 4: Email Inválido

```bash
# Email com formato inválido
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 100.00,
    "targetKeyType": "email",
    "targetKeyValue": "email-invalido"
  }'

# Esperado: Erro 400 TRANSACTIONS_INVALID_PIX_KEY_EMAIL
```

#### Teste 5: Telefone Inválido

```bash
# Telefone com formato inválido
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 100.00,
    "targetKeyType": "phone",
    "targetKeyValue": "123"
  }'

# Esperado: Erro 400 TRANSACTIONS_INVALID_PIX_KEY_PHONE
```

#### Teste 6: EVP Inválido

```bash
# EVP com formato inválido (não é UUID)
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 100.00,
    "targetKeyType": "evp",
    "targetKeyValue": "not-a-uuid"
  }'

# Esperado: Erro 400 TRANSACTIONS_INVALID_PIX_KEY_EVP
```

#### Teste 7: EVP Válido

```bash
# EVP válido (UUID)
curl -X POST http://localhost:3000/transactions/pix/cronos/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "uuid-da-conta",
    "amount": 100.00,
    "targetKeyType": "evp",
    "targetKeyValue": "550e8400-e29b-41d4-a716-446655440000"
  }'

# Esperado: Sucesso (se outros dados estiverem corretos)
```

---

## 7. Webhook Cronos

### O que faz

Recebe notificações da Cronos quando uma transação PIX é recebida:

1. **Valida assinatura**: Verifica HMAC-SHA256 usando `webhookSecret`
2. **Idempotência**: Verifica se webhook já foi processado (pelo `cronosId`)
3. **Busca transação existente**: Procura por `EndToEnd` ou `cronosId`
4. **Atualiza ou cria**: Atualiza transação pendente ou cria nova `cashin_cronos`
5. **Credita saldo**: Atualiza saldo da conta automaticamente

### Onde está implementado

- **Controller**: `src/webhooks/cronos/controllers/cronos-webhook.controller.ts`
- **Service**: `src/webhooks/cronos/services/cronos-webhook.service.ts`
- **Validator**: `src/shared/utils/webhook-signature.validator.ts`

### Como testar

#### Teste 1: Webhook com Assinatura Válida

```bash
# 1. Calcular assinatura HMAC-SHA256
# (usando webhookSecret configurado em WALLET_CRONOS_WEBHOOK_SECRET)

# Exemplo em Node.js:
const crypto = require('crypto');
const secret = 'seu-webhook-secret';
const body = JSON.stringify({
  id: 'test-id-123',
  amount: '100.00',
  description: 'Teste webhook',
  created_at: '2025-01-13 20:00:00',
  customer_document: '12345678900',
  EndToEnd: 'E12345678901234567890'
});
const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

# 2. Enviar webhook com assinatura
curl -X POST http://localhost:3000/api/cronos/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: $signature" \
  -d "$body"

# Esperado: Sucesso 200 com mensagem de processamento
```

#### Teste 2: Webhook com Assinatura Inválida

```bash
# Enviar webhook com assinatura incorreta
curl -X POST http://localhost:3000/api/cronos/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: assinatura-invalida" \
  -d '{
    "id": "test-id-123",
    "amount": "100.00",
    "customer_document": "12345678900"
  }'

# Esperado: Erro 401 Unauthorized - Invalid webhook signature
```

#### Teste 3: Webhook Sem Assinatura (quando webhookSecret está configurado)

```bash
# Enviar webhook sem header x-signature
curl -X POST http://localhost:3000/api/cronos/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-id-123",
    "amount": "100.00",
    "customer_document": "12345678900"
  }'

# Esperado: 
# - Se webhookSecret configurado: Warning no log (mas pode processar)
# - Se não configurado: Processa normalmente
```

#### Teste 4: Webhook Idempotente (Mesmo ID)

```bash
# 1. Enviar webhook pela primeira vez
curl -X POST http://localhost:3000/api/cronos/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: $signature1" \
  -d '{
    "id": "test-id-123",
    "amount": "100.00",
    "customer_document": "12345678900"
  }'

# 2. Enviar mesmo webhook novamente (mesmo id)
curl -X POST http://localhost:3000/api/cronos/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: $signature2" \
  -d '{
    "id": "test-id-123",
    "amount": "100.00",
    "customer_document": "12345678900"
  }'

# Esperado: 
# - Primeira vez: Cria/atualiza transação
# - Segunda vez: Retorna "transaction_already_exists" (idempotência)
```

#### Teste 5: Webhook Atualizando Transação Pendente

```bash
# 1. Criar transação pendente (via /create)
# 2. Obter EndToEnd da transação
# 3. Enviar webhook com mesmo EndToEnd

curl -X POST http://localhost:3000/api/cronos/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: $signature" \
  -d '{
    "id": "cronos-id-123",
    "amount": "100.00",
    "customer_document": "12345678900",
    "EndToEnd": "E12345678901234567890"
  }'

# Esperado: 
# - Transação pendente é atualizada para status "confirm"
# - Saldo é creditado
# - Retorna "transaction_updated"
```

#### Teste 6: Webhook Criando Nova Transação

```bash
# Enviar webhook para transação que não existe no sistema
curl -X POST http://localhost:3000/api/cronos/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: $signature" \
  -d '{
    "id": "cronos-id-456",
    "amount": "200.00",
    "description": "Recebimento PIX",
    "created_at": "2025-01-13 20:00:00",
    "customer_document": "12345678900",
    "EndToEnd": "E98765432109876543210"
  }'

# Esperado:
# - Nova transação cashin_cronos é criada
# - Status: "confirm"
# - Saldo é creditado
# - Retorna "transaction_created"
```

---

## 🔧 Configuração Necessária

### Variáveis de Ambiente

```bash
# Redis (opcional, para rate limiting distribuído)
WALLET_REDIS_URL=redis://password@host:6379/0

# Cronos Webhook Secret
WALLET_CRONOS_WEBHOOK_SECRET=seu-secret-aqui
```

### Banco de Dados

As validações de limite usam as tabelas:
- `spending_limit_profiles`: Perfis de limite
- `user_identity_spending_limits`: Limites por identidade de usuário

Certifique-se de que essas tabelas estão populadas com os limites desejados.

---

## 📊 Monitoramento

### Logs

Todas as validações e processamentos geram logs detalhados:

- **Validações**: Logs em `PixCronosValidationService`
- **Webhooks**: Logs em `CronosWebhookController` e `CronosWebhookService`
- **Rate Limiting**: Logs em `ThrottlerModule`

### Métricas Recomendadas

- Número de transações bloqueadas por validação
- Taxa de erro 429 (rate limit)
- Taxa de erro 400 (validações)
- Tempo de processamento de webhooks

---

## ✅ Checklist de Testes

- [ ] Saldo insuficiente bloqueia transação
- [ ] Limite máximo por transação funciona
- [ ] Limite diário funciona
- [ ] Limite de contagem diária funciona
- [ ] Limite de velocidade (3 em 60s) funciona
- [ ] Transações concorrentes não estouram saldo
- [ ] Transações pendentes são canceladas ao criar nova
- [ ] Duplicatas são detectadas (30 segundos)
- [ ] IdempotencyKey funciona
- [ ] Rate limit no /create (5/min)
- [ ] Rate limit no /confirm (10/min)
- [ ] Validação de CPF (válido e inválido)
- [ ] Validação de CNPJ (válido e inválido)
- [ ] Validação de EMAIL (válido e inválido)
- [ ] Validação de PHONE (válido e inválido)
- [ ] Validação de EVP (válido e inválido)
- [ ] Webhook com assinatura válida processa
- [ ] Webhook com assinatura inválida rejeita
- [ ] Webhook idempotente (mesmo ID)
- [ ] Webhook atualiza transação pendente
- [ ] Webhook cria nova transação

---

## 🚨 Troubleshooting

### Rate Limit não funciona

- Verificar se Redis está configurado e acessível
- Verificar logs do `ThrottlerModule`
- Se Redis não estiver disponível, usa fallback in-memory (funciona apenas localmente)

### Webhook rejeita assinatura válida

- Verificar se `rawBody` está sendo capturado corretamente
- Verificar se `webhookSecret` está configurado corretamente
- Comparar assinatura calculada com recebida (logs)

### Validações não funcionam

- Verificar se `spending_limit_profiles` está populado
- Verificar se `user_identity_spending_limits` está configurado
- Verificar logs de validação para detalhes

---

**Última atualização**: 13/01/2026
