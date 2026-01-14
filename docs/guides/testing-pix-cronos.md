# Testing PIX Cronos

This guide shows how to test PIX Cronos transaction endpoints using Postman.

## Prerequisites

1. **Configure SQS**: Configure SQS queue and run worker (see below)
2. **Get JWT Token**: Login to obtain authentication token
   - Use `/test/auth/login` for development
   - Or `/backoffice/auth/login` for backoffice
3. **Base URL**: Configure API base URL in Postman (e.g., `http://localhost:3000`)

## SQS and Worker Configuration

### Configure Environment Variables

Add to `.env`, `env.prod` or `env.sandbox`:

```env
AWS_REGION=us-east-2
SQS_TRANSACTIONS_QUEUE_URL=https://sqs.us-east-2.amazonaws.com/YOUR_ACCOUNT_ID/YOUR_QUEUE_NAME
WALLET_MYSQL_URL=mysql://user:password@host:3306/database
```

**Note**: If you don't have AWS access, you can use LocalStack or leave empty for development (system will log queue not configured).

### Create SQS Queue (if needed)

```bash
aws sqs create-queue \
  --queue-name transactions-queue \
  --region us-east-2 \
  --attributes MessageRetentionPeriod=86400,VisibilityTimeout=60
```

### Run Worker

Worker processes SQS queue messages. Run in separate terminal:

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

**Important**: Keep worker running while testing!

### Verify Worker is Running

You should see logs:

```
[INFO] Worker started. Waiting for messages from SQS queue...
[INFO] Environment: development
```

When processing messages:

```
[INFO] Processing job: pix_cronos_create (MessageId: ...)
[INFO] PIX Cronos create job processed successfully for transaction: ...
```

## Available Endpoints

### Create PIX Cronos Transaction

**POST** `/transactions/pix/cronos/create`

**Headers:**
```
Authorization: Bearer {your_jwt_token}
Content-Type: application/json
```

**Body:**
```json
{
  "sourceAccountId": "uuid-source-account",
  "amount": 100.5,
  "targetKeyType": "cpf",
  "targetKeyValue": "12345678900",
  "description": "PIX transfer test"
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
  "id": "uuid-transaction",
  "status": "pending",
  "amount": 100.5,
  "createdAt": "2026-01-07T20:00:00.000Z",
  "targetName": "RECIPIENT NAME",
  "targetAlias": "cpf 12345678900",
  "targetTaxDocumentNumber": "12345678900",
  "targetTaxDocumentType": "CPF",
  "targetBank": "Recipient Bank",
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

### Confirm PIX Cronos Transaction

**POST** `/transactions/pix/cronos/confirm`

**Headers:**
```
Authorization: Bearer {your_jwt_token}
Content-Type: application/json
```

**Body:**
```json
{
  "transactionId": "uuid-created-transaction"
}
```

**Fields:**
- `transactionId` (string, required): ID of previously created transaction

**Success Response (200):**
```json
{
  "id": "uuid-transaction",
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
  "email": "user@example.com",
  "password": "user-password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... },
  "message": "200 users.success.login"
}
```

Copy the `token` value.

### Step 2: Create PIX Transaction

1. Set method to **POST**
2. URL: `{{base_url}}/transactions/pix/cronos/create`
3. In **Headers** tab:
   - `Authorization`: `Bearer {paste_token_here}`
   - `Content-Type`: `application/json`
4. In **Body** tab (raw JSON):
```json
{
  "sourceAccountId": "your-account-uuid",
  "amount": 50.0,
  "targetKeyType": "cpf",
  "targetKeyValue": "12345678900",
  "description": "PIX Test"
}
```
5. Click **Send**

### Step 3: Confirm Transaction

1. Use `id` from Step 2
2. Set method to **POST**
3. URL: `{{base_url}}/transactions/pix/cronos/confirm`
4. In **Headers** tab:
   - `Authorization`: `Bearer {paste_token_here}`
   - `Content-Type`: `application/json`
5. In **Body** tab (raw JSON):
```json
{
  "transactionId": "uuid-from-step-2"
}
```
6. Click **Send**

## Postman Environment

Configure variables:

```
base_url: http://localhost:3000
auth_token: {paste_token_here}
transaction_id: {filled_after_creating}
```

Use `{{base_url}}`, `{{auth_token}}`, `{{transaction_id}}` in requests.

## Supported PIX Key Types

| Type    | Description            | Example                                |
| ------- | ---------------------- | -------------------------------------- |
| `cpf`   | CPF (11 digits)        | `12345678900`                          |
| `cnpj`  | CNPJ (14 digits)       | `12345678000190`                       |
| `email` | Valid email            | `person@example.com`                   |
| `phone` | Phone (+5511999999999) | `+5511999999999`                       |
| `evp`   | Random key (UUID)      | `123e4567-e89b-12d3-a456-426614174000` |

## Transaction Status Codes

- `pending`: Transaction created, awaiting confirmation
- `process`: Transaction confirmed, being processed
- `confirm`: Transaction processed successfully
- `reverse`: Transaction reversed
- `cancel`: Transaction cancelled
- `error`: Error processing transaction

## Common Errors

### 401 Unauthorized

**Cause**: Invalid or expired token
**Solution**: Login again to get new token

### 400 Bad Request

**Cause**: Invalid data (non-existent account, invalid amount)
**Solution**: Verify request body data

### 404 Not Found

**Cause**: Transaction not found
**Solution**: Verify `transactionId` is correct

## Important Notes

1. **Asynchronous Transactions**: After creating and confirming, transaction is sent for asynchronous processing via SQS

2. **Account Validation**: Source account must:
   - Belong to authenticated user
   - Have status `enable`
   - Have active identity associated

3. **Minimum Values**: Minimum transfer amount is `0.01`

4. **Environment**: Works only in authenticated environment

## Auto-Save Variables Script

Add to Create Transaction **Tests** tab:

```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("transaction_id", response.id);
  console.log("Transaction ID saved:", response.id);
}
```

## References

- [Worker Architecture](../architecture/worker.md)
- [API Documentation](../api/secure-auth.md)
- [Testing Guide](testing.md)
- [Cronos cURL Testing](testing-cronos-curl.md)
