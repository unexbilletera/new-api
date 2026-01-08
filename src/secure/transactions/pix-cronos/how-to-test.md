# Como Testar PIX Cronos no Postman

Este guia mostra como testar os endpoints de transações PIX Cronos usando o Postman.

## Pré-requisitos

1. **Configurar SQS**: Antes de testar, você precisa configurar a fila SQS e rodar o worker
   - Ver seção [Configuração do SQS e Worker](#configuração-do-sqs-e-worker) abaixo

2. **Obter Token JWT**: Você precisa fazer login primeiro para obter um token de autenticação.
   - Use o endpoint `/test/auth/login` para obter um token (modo desenvolvimento)
   - Ou use o endpoint `/backoffice/auth/login` para backoffice

3. **Base URL**: Configure a base URL da API no Postman (ex: `http://localhost:3000`)

## Configuração do SQS e Worker

### 1. Configurar Variáveis de Ambiente

Adicione no seu arquivo `.env`, `env.prod` ou `env.sandbox`:

```env
# AWS SQS Configuration
AWS_REGION=us-east-2
SQS_TRANSACTIONS_QUEUE_URL=https://sqs.us-east-2.amazonaws.com/SEU_ACCOUNT_ID/SEU_QUEUE_NAME

# Database (já deve estar configurado)
WALLET_MYSQL_URL=mysql://user:password@host:3306/database
```

**Nota**: Se você não tem acesso à AWS ainda, pode usar uma fila local (LocalStack) ou deixar vazio para desenvolvimento (o sistema irá apenas logar que a fila não está configurada).

### 2. Criar Fila SQS na AWS (se necessário)

Se você precisar criar a fila:

```bash
# Via AWS CLI
aws sqs create-queue \
  --queue-name transactions-queue \
  --region us-east-2 \
  --attributes MessageRetentionPeriod=86400,VisibilityTimeout=60

# Pegue a URL da fila e adicione no .env
```

### 3. Rodar o Worker

O worker processa as mensagens da fila SQS em background. Você precisa rodá-lo em um terminal separado:

**Desenvolvimento:**
```bash
npm run start:worker
# ou
yarn start:worker
```

**Produção:**
```bash
npm run build:prod
npm run start:prod:worker
```

O worker irá:
- Receber mensagens da fila SQS
- Processar jobs de transações PIX Cronos
- Atualizar status das transações no banco de dados

**Importante**: Mantenha o worker rodando enquanto testa os endpoints!

### 4. Verificar se está funcionando

Quando o worker estiver rodando, você deve ver logs como:
```
[INFO] Worker iniciado. Aguardando mensagens da fila SQS...
[INFO] Worker iniciando...
[INFO] Environment: development
```

Quando uma mensagem for processada:
```
[INFO] Processando job: pix_cronos_create (MessageId: ...)
[INFO] PIX Cronos create job processed successfully for transaction: ...
```

## Endpoints Disponíveis

### 1. Criar Transação PIX Cronos

**POST** `/transactions/pix/cronos/create`

**Headers:**
```
Authorization: Bearer {seu_token_jwt}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "sourceAccountId": "uuid-da-conta-origem",
  "amount": 100.50,
  "targetKeyType": "cpf",
  "targetKeyValue": "12345678900",
  "description": "Transferência PIX teste"
}
```

**Campos:**
- `sourceAccountId` (string, obrigatório): ID da conta de origem
- `amount` (number, obrigatório): Valor da transferência (mínimo 0.01)
- `targetKeyType` (string, obrigatório): Tipo da chave PIX (`cpf`, `cnpj`, `email`, `phone`, `evp`)
- `targetKeyValue` (string, obrigatório): Valor da chave PIX
- `description` (string, opcional): Descrição da transferência

**Exemplo de Resposta (200):**
```json
{
  "id": "uuid-da-transacao",
  "status": "pending",
  "amount": 100.5,
  "createdAt": "2026-01-07T20:00:00.000Z",
  "message": "200 transactions.success.created",
  "code": "200 transactions.success.created"
}
```

**Exemplo de Erro (400):**
```json
{
  "error": "400 transactions.errors.invalidSourceAccount",
  "message": "400 transactions.errors.invalidSourceAccount",
  "code": 400
}
```

---

### 2. Confirmar Transação PIX Cronos

**POST** `/transactions/pix/cronos/confirm`

**Headers:**
```
Authorization: Bearer {seu_token_jwt}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "transactionId": "uuid-da-transacao-criada"
}
```

**Campos:**
- `transactionId` (string, obrigatório): ID da transação criada anteriormente

**Exemplo de Resposta (200):**
```json
{
  "id": "uuid-da-transacao",
  "status": "process",
  "message": "Transação enviada para processamento",
  "message": "200 transactions.success.confirmed",
  "code": "200 transactions.success.confirmed"
}
```

**Exemplo de Erro (404):**
```json
{
  "error": "400 transactions.errors.invalidId",
  "message": "400 transactions.errors.invalidId",
  "code": 400
}
```

---

## Fluxo Completo de Teste

### Passo 1: Obter Token de Autenticação

**POST** `/test/auth/login`

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha-do-usuario"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... },
  "message": "200 users.success.login",
  "code": "200 users.success.login"
}
```

Copie o valor do campo `token` para usar nos próximos endpoints.

---

### Passo 2: Criar uma Transação PIX

1. Configure o método como **POST**
2. URL: `{{base_url}}/transactions/pix/cronos/create`
3. Na aba **Headers**, adicione:
   - `Authorization`: `Bearer {cole_o_token_aqui}`
   - `Content-Type`: `application/json`
4. Na aba **Body**, selecione **raw** e **JSON**, cole:
```json
{
  "sourceAccountId": "uuid-da-sua-conta",
  "amount": 50.00,
  "targetKeyType": "cpf",
  "targetKeyValue": "12345678900",
  "description": "Teste PIX"
}
```
5. Clique em **Send**

---

### Passo 3: Confirmar a Transação

1. Use o `id` retornado no Passo 2
2. Configure o método como **POST**
3. URL: `{{base_url}}/transactions/pix/cronos/confirm`
4. Na aba **Headers**, adicione:
   - `Authorization`: `Bearer {cole_o_token_aqui}`
   - `Content-Type`: `application/json`
5. Na aba **Body**, selecione **raw** e **JSON**, cole:
```json
{
  "transactionId": "uuid-da-transacao-do-passo-2"
}
```
6. Clique em **Send**

---

## Variáveis de Ambiente no Postman

Para facilitar os testes, configure as seguintes variáveis no Postman:

```
base_url: http://localhost:3000
auth_token: {cole_o_token_aqui}
transaction_id: {será_preenchido_após_criar}
```

Então use `{{base_url}}`, `{{auth_token}}` e `{{transaction_id}}` nas suas requisições.

---

## Tipos de Chave PIX Suportados

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `cpf` | CPF (11 dígitos) | `12345678900` |
| `cnpj` | CNPJ (14 dígitos) | `12345678000190` |
| `email` | E-mail válido | `pessoa@exemplo.com` |
| `phone` | Telefone (+5511999999999) | `+5511999999999` |
| `evp` | Chave aleatória (UUID) | `123e4567-e89b-12d3-a456-426614174000` |

---

## Códigos de Status

- `pending`: Transação criada, aguardando confirmação
- `process`: Transação confirmada, sendo processada
- `confirm`: Transação processada com sucesso
- `reverse`: Transação estornada
- `cancel`: Transação cancelada
- `error`: Erro ao processar transação

---

## Erros Comuns

### 401 Unauthorized
**Causa**: Token inválido ou expirado  
**Solução**: Faça login novamente para obter um novo token

### 400 Bad Request
**Causa**: Dados inválidos (conta inexistente, valor inválido, etc.)  
**Solução**: Verifique os dados enviados no body

### 404 Not Found
**Causa**: Transação não encontrada  
**Solução**: Verifique se o `transactionId` está correto

---

## Notas Importantes

1. **Transações Assíncronas**: Após criar e confirmar uma transação, ela é enviada para processamento assíncrono via SQS. O status será atualizado por um worker em background.

2. **Validação de Conta**: A conta de origem deve:
   - Pertencer ao usuário autenticado
   - Estar com status `enable`
   - Ter uma identidade ativa associada

3. **Valores Mínimos**: O valor mínimo para transferência é `0.01`

4. **Ambiente**: Este endpoint funciona apenas em ambiente autenticado (área logada)

