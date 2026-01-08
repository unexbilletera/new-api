# Testing PIX Cronos in Postman

This guide shows how to test PIX Cronos transaction endpoints using Postman.

## Prerequisites

1. **Configure SQS**: Before testing, you need to configure SQS queue and run worker
   - See [SQS and Worker Configuration](#sqs-and-worker-configuration) section below

2. **Get JWT Token**: You need to login first to obtain authentication token.
   - Use endpoint `/test/auth/login` to get token (development mode)
   - Or use endpoint `/backoffice/auth/login` for backoffice

3. **Base URL**: Configure the API base URL in Postman (e.g., `http://localhost:3000`)

## SQS and Worker Configuration

### 1. Configure Environment Variables

Add to your `.env`, `env.prod` or `env.sandbox` file:

```env
AWS_REGION=us-east-2
SQS_TRANSACTIONS_QUEUE_URL=https://sqs.us-east-2.amazonaws.com/YOUR_ACCOUNT_ID/YOUR_QUEUE_NAME
WALLET_MYSQL_URL=mysql://user:password@host:3306/database
```

**Note**: If you don't have AWS access yet, you can use a local queue (LocalStack) or leave empty for development (system will only log that queue is not configured).

### 2. Create SQS Queue in AWS (if needed)

If you need to create the queue:

```bash
aws sqs create-queue \
  --queue-name transactions-queue \
  --region us-east-2 \
  --attributes MessageRetentionPeriod=86400,VisibilityTimeout=60

# Get queue URL and add to .env
```

### 3. Run Worker

Worker processes SQS queue messages in background. Run it in a separate terminal:

**Development:**
```bash
npm run start:worker
```

**Production:**
```bash
npm run build:prod
npm run start:prod:worker
```

Worker will:
- Receive messages from SQS queue
- Process PIX Cronos transaction jobs
- Update transaction status in database

**Important**: Keep worker running while testing endpoints!

### 4. Verify it's working

When worker is running, you should see logs like:
```
[INFO] Worker iniciado. Aguardando mensagens da fila SQS...
[INFO] Worker iniciando...
[INFO] Environment: development
```

When a message is processed:
```
[INFO] Processando job: pix_cronos_create (MessageId: ...)
[INFO] PIX Cronos create job processed successfully for transaction: ...
```

## Available Endpoints

### 1. Create PIX Cronos Transaction

**POST** `/transactions/pix/cronos/create`

**Headers:**
```
Authorization: Bearer {your_jwt_token}
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

**Fields:**
- `sourceAccountId` (string, required): Source account ID
- `amount` (number, required): Transfer amount (minimum 0.01)
- `targetKeyType` (string, required): PIX key type (`cpf`, `cnpj`, `email`, `phone`, `evp`)
- `targetKeyValue` (string, required): PIX key value
- `description` (string, optional): Transfer description

**Success Response (200):**
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

**Error Response (400):**
```json
{
  "error": "400 transactions.errors.invalidSourceAccount",
  "message": "400 transactions.errors.invalidSourceAccount",
  "code": 400
}
```

### 2. Confirm PIX Cronos Transaction

**POST** `/transactions/pix/cronos/confirm`

**Headers:**
```
Authorization: Bearer {your_jwt_token}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "transactionId": "uuid-da-transacao-criada"
}
```

**Fields:**
- `transactionId` (string, required): ID of previously created transaction

**Success Response (200):**
```json
{
  "id": "uuid-da-transacao",
  "status": "process",
  "message": "200 transactions.success.confirmed",
  "code": "200 transactions.success.confirmed"
}
```

**Error Response (404):**
```json
{
  "error": "400 transactions.errors.invalidId",
  "message": "400 transactions.errors.invalidId",
  "code": 400
}
```

## Complete Test Flow

### Step 1: Get Authentication Token

**POST** `/test/auth/login`

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha-do-usuario"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... },
  "message": "200 users.success.login",
  "code": "200 users.success.login"
}
```

Copy the `token` value to use in next endpoints.

### Step 2: Create PIX Transaction

1. Set method to **POST**
2. URL: `{{base_url}}/transactions/pix/cronos/create`
3. In **Headers** tab, add:
   - `Authorization`: `Bearer {paste_token_here}`
   - `Content-Type`: `application/json`
4. In **Body** tab, select **raw** and **JSON**, paste:
```json
{
  "sourceAccountId": "uuid-da-sua-conta",
  "amount": 50.00,
  "targetKeyType": "cpf",
  "targetKeyValue": "12345678900",
  "description": "Teste PIX"
}
```
5. Click **Send**

### Step 3: Confirm Transaction

1. Use the `id` returned in Step 2
2. Set method to **POST**
3. URL: `{{base_url}}/transactions/pix/cronos/confirm`
4. In **Headers** tab, add:
   - `Authorization`: `Bearer {paste_token_here}`
   - `Content-Type`: `application/json`
5. In **Body** tab, select **raw** and **JSON**, paste:
```json
{
  "transactionId": "uuid-da-transacao-do-passo-2"
}
```
6. Click **Send**

## Postman Environment Variables

Configure these variables in Postman:

```
base_url: http://localhost:3000
auth_token: {paste_token_here}
transaction_id: {will_be_filled_after_creating}
```

Then use `{{base_url}}`, `{{auth_token}}` and `{{transaction_id}}` in your requests.

## Supported PIX Key Types

| Type | Description | Example |
|------|-------------|---------|
| `cpf` | CPF (11 digits) | `12345678900` |
| `cnpj` | CNPJ (14 digits) | `12345678000190` |
| `email` | Valid email | `pessoa@exemplo.com` |
| `phone` | Phone (+5511999999999) | `+5511999999999` |
| `evp` | Random key (UUID) | `123e4567-e89b-12d3-a456-426614174000` |

## Status Codes

- `pending`: Transaction created, awaiting confirmation
- `process`: Transaction confirmed, being processed
- `confirm`: Transaction processed successfully
- `reverse`: Transaction reversed
- `cancel`: Transaction cancelled
- `error`: Error processing transaction

## Common Errors

### 401 Unauthorized
**Cause**: Invalid or expired token  
**Solution**: Login again to get a new token

### 400 Bad Request
**Cause**: Invalid data (non-existent account, invalid amount, etc.)  
**Solution**: Verify data sent in body

### 404 Not Found
**Cause**: Transaction not found  
**Solution**: Verify `transactionId` is correct

## Important Notes

1. **Asynchronous Transactions**: After creating and confirming a transaction, it is sent for asynchronous processing via SQS. Status will be updated by a background worker.

2. **Account Validation**: Source account must:
   - Belong to authenticated user
   - Have status `enable`
   - Have an active identity associated

3. **Minimum Values**: Minimum transfer amount is `0.01`

4. **Environment**: This endpoint works only in authenticated environment (logged area)
