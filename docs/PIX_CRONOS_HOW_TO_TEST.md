# How to Test PIX Cronos in Postman

This guide shows how to test PIX Cronos transaction endpoints using Postman.

## Prerequisites

1. **Configure SQS**: Before testing, you need to configure the SQS queue and run the worker
   - See [SQS and Worker Configuration](#sqs-and-worker-configuration) section below

2. **Get JWT Token**: You need to login first to obtain an authentication token.
   - Use the `/test/auth/login` endpoint to get a token (development mode)
   - Or use the `/backoffice/auth/login` endpoint for backoffice

3. **Base URL**: Configure the API base URL in Postman (e.g., `http://localhost:3000`)

4. **Swagger Documentation**: Access `http://localhost:3000/api/docs` to see the interactive API documentation

## SQS and Worker Configuration

### 1. Configure Environment Variables

Add to your `.env`, `env.prod` or `env.sandbox` file:

```env
# AWS SQS Configuration
AWS_REGION=us-east-2
SQS_TRANSACTIONS_QUEUE_URL=https://sqs.us-east-2.amazonaws.com/YOUR_ACCOUNT_ID/YOUR_QUEUE_NAME

# Database (should already be configured)
WALLET_MYSQL_URL=mysql://user:password@host:3306/database
```

**Note**: If you don't have AWS access yet, you can use a local queue (LocalStack) or leave it empty for development (the system will just log that the queue is not configured).

### 2. Create SQS Queue in AWS (if needed)

If you need to create the queue:

```bash
# Via AWS CLI
aws sqs create-queue \
  --queue-name transactions-queue \
  --region us-east-2 \
  --attributes MessageRetentionPeriod=86400,VisibilityTimeout=60

# Get the queue URL and add it to .env
```

### 3. Run the Worker

The worker processes SQS queue messages in the background. You need to run it in a separate terminal:

**Development:**
```bash
npm run start:worker
# or
yarn start:worker
```

**Production:**
```bash
npm run build:prod
npm run start:prod:worker
```

The worker will:
- Receive messages from the SQS queue
- Process PIX Cronos transaction jobs
- Update transaction status in the database

**Important**: Keep the worker running while testing the endpoints!

### 4. Verify it's working

When the worker is running, you should see logs like:
```
[INFO] Worker started. Waiting for messages from SQS queue...
[INFO] Worker starting...
[INFO] Environment: development
```

When a message is processed:
```
[INFO] Processing job: pix_cronos_create (MessageId: ...)
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
  "sourceAccountId": "uuid-of-source-account",
  "amount": 100.50,
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

**Example Response (200):**
```json
{
  "id": "uuid-of-transaction",
  "status": "pending",
  "amount": 100.5,
  "createdAt": "2026-01-07T20:00:00.000Z",
  "targetName": "RECIPIENT NAME",
  "targetAlias": "cpf 12345678900",
  "targetTaxDocumentNumber": "12345678900",
  "targetTaxDocumentType": "CPF",
  "targetBank": "Recipient Bank",
  "targetAccountNumber": "{\"bank\":\"001\",\"agency\":\"0001\",\"number\":\"12345\"}",
  "message": "200 transactions.success.created",
  "code": "200 transactions.success.created"
}
```

**Returned Fields:**
- `id`: Unique ID of the created transaction
- `status`: Transaction status (`pending` initially)
- `amount`: Transfer amount
- `createdAt`: Transaction creation date
- `targetName`: Recipient name (obtained from Cronos API)
- `targetAlias`: Recipient alias/identification
- `targetTaxDocumentNumber`: Recipient CPF/CNPJ
- `targetTaxDocumentType`: Document type (CPF/CNPJ)
- `targetBank`: Recipient bank name
- `targetAccountNumber`: Recipient account data (JSON stringified)

**Example Error (400):**
```json
{
  "error": "400 transactions.errors.invalidSourceAccount",
  "message": "400 transactions.errors.invalidSourceAccount",
  "code": 400
}
```

---

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
  "transactionId": "uuid-of-created-transaction"
}
```

**Fields:**
- `transactionId` (string, required): ID of the previously created transaction

**Example Response (200):**
```json
{
  "id": "uuid-of-transaction",
  "status": "process",
  "message": "Transaction sent for processing",
  "message": "200 transactions.success.confirmed",
  "code": "200 transactions.success.confirmed"
}
```

**Example Error (404):**
```json
{
  "error": "400 transactions.errors.invalidId",
  "message": "400 transactions.errors.invalidId",
  "code": 400
}
```

---

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
  "message": "200 users.success.login",
  "code": "200 users.success.login"
}
```

Copy the value from the `token` field to use in the next endpoints.

---

### Step 2: Create a PIX Transaction

1. Set method to **POST**
2. URL: `{{base_url}}/transactions/pix/cronos/create`
3. In **Headers** tab, add:
   - `Authorization`: `Bearer {paste_token_here}`
   - `Content-Type`: `application/json`
4. In **Body** tab, select **raw** and **JSON**, paste:
```json
{
  "sourceAccountId": "uuid-of-your-account",
  "amount": 50.00,
  "targetKeyType": "cpf",
  "targetKeyValue": "12345678900",
  "description": "PIX Test"
}
```
5. Click **Send**

---

### Step 3: Confirm the Transaction

1. Use the `id` returned in Step 2
2. Set method to **POST**
3. URL: `{{base_url}}/transactions/pix/cronos/confirm`
4. In **Headers** tab, add:
   - `Authorization`: `Bearer {paste_token_here}`
   - `Content-Type`: `application/json`
5. In **Body** tab, select **raw** and **JSON**, paste:
```json
{
  "transactionId": "uuid-of-transaction-from-step-2"
}
```
6. Click **Send**

---

## Postman Environment Variables

To facilitate testing, configure the following variables in Postman:

```
base_url: http://localhost:3000
auth_token: {paste_token_here}
transaction_id: {will_be_filled_after_creating}
```

Then use `{{base_url}}`, `{{auth_token}}` and `{{transaction_id}}` in your requests.

---

## Supported PIX Key Types

| Type | Description | Example |
|------|-----------|---------|
| `cpf` | CPF (11 digits) | `12345678900` |
| `cnpj` | CNPJ (14 digits) | `12345678000190` |
| `email` | Valid email | `person@example.com` |
| `phone` | Phone (+5511999999999) | `+5511999999999` |
| `evp` | Random key (UUID) | `123e4567-e89b-12d3-a456-426614174000` |

---

## Status Codes

- `pending`: Transaction created, awaiting confirmation
- `process`: Transaction confirmed, being processed
- `confirm`: Transaction processed successfully
- `reverse`: Transaction reversed
- `cancel`: Transaction cancelled
- `error`: Error processing transaction

---

## Common Errors

### 401 Unauthorized
**Cause**: Invalid or expired token  
**Solution**: Login again to get a new token

### 400 Bad Request
**Cause**: Invalid data (non-existent account, invalid value, etc.)  
**Solution**: Check the data sent in the body

### 404 Not Found
**Cause**: Transaction not found  
**Solution**: Verify the `transactionId` is correct

---

## Important Notes

1. **Asynchronous Transactions**: After creating and confirming a transaction, it is sent for asynchronous processing via SQS. The status will be updated by a background worker.

2. **Account Validation**: The source account must:
   - Belong to the authenticated user
   - Have status `enable`
   - Have an active associated identity

3. **Minimum Values**: The minimum transfer amount is `0.01`

4. **Environment**: This endpoint only works in authenticated environment (logged area)

---

## Swagger Documentation

The API has interactive Swagger documentation available at:

**URL**: `http://localhost:3000/api/docs`

### How to use Swagger:

1. **Access the URL**: Open `http://localhost:3000/api/docs` in your browser
2. **Authentication**: 
   - Click the **"Authorize"** button at the top of the page
   - Paste your JWT token in the field (without the "Bearer" prefix)
   - Click **"Authorize"** and then **"Close"**
3. **Test Endpoints**:
   - Expand the desired endpoint (e.g., `POST /transactions/pix/cronos/create`)
   - Click **"Try it out"**
   - Fill in the body fields
   - Click **"Execute"**
   - See the response below

### Swagger Advantages:

- Interactive and always up-to-date documentation
- Test directly in the browser without needing Postman
- Request/response examples
- Automatic field validation
- Integrated JWT authentication

### Installation

To enable Swagger, install the dependency:

```bash
npm install @nestjs/swagger
# or
yarn add @nestjs/swagger
```

After installing, restart the server and access `http://localhost:3000/api/docs`.
