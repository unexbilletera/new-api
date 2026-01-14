# PIX Cronos Transactions

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Complete PIX transaction processing via Cronos API integration. Supports creating PIX transfers and confirming them with transactional password security.

## Code References

**Controller:** `src/secure/transactions/pix-cronos/controllers/pix-cronos.controller.ts`
**Service:** `src/secure/transactions/pix-cronos/services/pix-cronos.service.ts`
**Model:** `src/secure/transactions/pix-cronos/models/pix-cronos-transaction.model.ts`

## Endpoints

### POST /transactions/pix/cronos/create

Create a new PIX transaction via Cronos API.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14
**Test Status:** ✅ PASSED

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Request Body

**Required:**
- `sourceAccountId` (string): Source account UUID
- `amount` (number): Transfer amount (minimum 0.01)
- `targetKeyType` (string): PIX key type
  - `cpf`: Brazilian CPF document
  - `cnpj`: Brazilian CNPJ document
  - `email`: Email address
  - `phone`: Phone number
  - `evp`: Random key (Chave Aleatória)
- `targetKeyValue` (string): PIX key value

**Optional:**
- `description` (string): Transfer description

#### Request Example

```json
{
  "sourceAccountId": "uuid-da-conta-origem",
  "amount": 100.50,
  "targetKeyType": "cpf",
  "targetKeyValue": "12345678900",
  "description": "PIX transfer test"
}
```

#### Success Response (200)

```json
{
  "id": "uuid-da-transacao",
  "status": "pending",
  "amount": 100.50,
  "createdAt": "2026-01-14T10:00:00.000Z",
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

#### Error Responses

**400 - Invalid Source Account**
```json
{
  "error": "400 transactions.errors.invalidSourceAccount",
  "message": "Source account not found or invalid",
  "code": 400
}
```

**400 - Insufficient Balance**
```json
{
  "error": "400 transactions.errors.insufficientBalance",
  "message": "Insufficient balance for transaction",
  "code": 400
}
```

**400 - Invalid Amount**
```json
{
  "error": "400 transactions.errors.invalidAmount",
  "message": "Amount must be at least 0.01",
  "code": 400
}
```

**400 - Invalid PIX Key**
```json
{
  "error": "400 transactions.errors.invalidPixKey",
  "message": "Invalid PIX key format or key not found",
  "code": 400
}
```

#### Code Flow

```
PixCronosController.create()
  └─> PixCronosService.createTransaction()
      ├─> AccountModel.findById()  // Validate source account
      │   └─> prisma.accounts.findFirst()
      ├─> AccountModel.validateBalance()  // Check balance
      ├─> CronosApiService.createPIX()  // Fetch recipient data
      │   └─> HTTP POST to Cronos API
      └─> PixCronosTransactionModel.create()
          └─> prisma.transactions.create()
```

---

### POST /transactions/pix/cronos/confirm

Confirm pending PIX transaction with transactional password.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14
**Test Status:** ✅ PASSED

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Request Body

**Required:**
- `transactionId` (string): Transaction UUID to confirm

**Optional:**
- `transactionalPassword` (string): 4-digit password (required if user has one set)

#### Request Example

```json
{
  "transactionId": "uuid-da-transacao",
  "transactionalPassword": "1234"
}
```

#### Success Response (200)

```json
{
  "id": "uuid-da-transacao",
  "status": "process",
  "message": "Transaction sent for processing",
  "code": "200 transactions.success.confirmed"
}
```

#### Error Responses

**400 - Transaction Not Found**
```json
{
  "error": "400 transactions.errors.invalidId",
  "message": "Transaction not found",
  "code": 400
}
```

**400 - Invalid Status**
```json
{
  "error": "400 transactions.errors.invalidStatus",
  "message": "Transaction must be in pending status",
  "code": 400
}
```

**401 - Invalid Transactional Password**
```json
{
  "error": "401 transactions.errors.invalidTransactionalPassword",
  "message": "Invalid transactional password",
  "code": 401
}
```

**404 - Transactional Password Required**
```json
{
  "error": "404 transactions.errors.transactionalPasswordRequired",
  "message": "Transactional password is required for this operation",
  "code": 404
}
```

#### Code Flow

```
PixCronosController.confirm()
  └─> PixCronosService.confirmTransaction()
      ├─> PixCronosTransactionModel.findById()  // Validate transaction
      │   └─> prisma.transactions.findFirst()
      ├─> TransactionalPasswordService.validate()  // Check password
      │   └─> bcrypt.compare()
      ├─> PixCronosTransactionModel.updateStatus()  // Set to "process"
      │   └─> prisma.transactions.update()
      └─> SQSService.sendMessage()  // Send to queue
          └─> AWS SQS sendMessage()
```

---

## PIX Key Types

Supported PIX key formats:

| Type | Description | Format | Example |
|------|-------------|--------|---------|
| `cpf` | Brazilian CPF | 11 digits | `12345678900` |
| `cnpj` | Brazilian CNPJ | 14 digits | `12345678000199` |
| `email` | Email address | Valid email | `user@example.com` |
| `phone` | Phone number | +Country code + number | `+5511999999999` |
| `evp` | Random key | UUID format | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |

## Business Rules

1. **Source Account Validation**: Account must belong to authenticated user
2. **Account Status**: Source account must have status `enable`
3. **Balance Check**: Account must have sufficient balance for amount + fees
4. **Minimum Amount**: Transfers must be >= 0.01
5. **Transaction Status**: Only `pending` transactions can be confirmed
6. **Transactional Password**: Required if user has one configured
7. **Rate Limiting**: 10 requests/minute per user
8. **Timeout**: Transaction expires after 5 minutes if not confirmed

## Transaction Status Flow

```
pending → process → confirm
         ↓
       error
         ↓
      reverse
```

- **pending**: Transaction created, awaiting confirmation
- **process**: Confirmation received, processing via SQS
- **confirm**: Successfully completed by Cronos
- **error**: Failed during processing
- **reverse**: Reversed by provider

## Asynchronous Processing

After confirmation, transaction is sent to SQS queue for processing:

1. **Queue**: Transaction sent to `SQS_TRANSACTIONS_QUEUE_URL`
2. **Worker**: Background worker processes queue messages
3. **Cronos API**: Worker calls Cronos `confirmartransferencia` endpoint
4. **Status Update**: Transaction status updated based on response
5. **Notification**: User notified of completion/failure

### Required Environment Variables

```env
AWS_REGION=us-east-2
SQS_TRANSACTIONS_QUEUE_URL=https://sqs.us-east-2.amazonaws.com/.../queue
```

## Security Features

- JWT authentication required
- Source account ownership validation
- Transactional password security (4-digit PIN)
- Rate limiting on endpoints
- Audit logging for all operations
- Transaction timeout for unconfirmed transfers

## Error Codes

- `400 transactions.errors.invalidSourceAccount` - Account not found/invalid
- `400 transactions.errors.insufficientBalance` - Not enough balance
- `400 transactions.errors.invalidAmount` - Amount too low
- `400 transactions.errors.invalidPixKey` - Invalid PIX key
- `400 transactions.errors.invalidId` - Transaction not found
- `400 transactions.errors.invalidStatus` - Transaction not pending
- `401 transactions.errors.invalidTransactionalPassword` - Wrong password
- `404 transactions.errors.transactionalPasswordRequired` - Password required
- `429 transactions.errors.tooManyRequests` - Rate limit exceeded

## Testing

### Manual Testing

See [PIX Cronos Testing Guide](../../guides/testing-pix-cronos.md)

### cURL Testing

See [Cronos cURL Testing](../../guides/testing-cronos-curl.md)

### Automated Testing

```bash
npm run test:unit -- pix-cronos.service.spec.ts
npm run test:e2e -- pix-cronos.e2e-spec.ts
```

## Complete Flow Example

### Step 1: Create Transaction

```bash
POST /transactions/pix/cronos/create
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "sourceAccountId": "account-uuid",
  "amount": 100.50,
  "targetKeyType": "cpf",
  "targetKeyValue": "12345678900",
  "description": "Payment"
}
```

**Response:**
```json
{
  "id": "transaction-uuid",
  "status": "pending",
  "amount": 100.50,
  "targetName": "RECIPIENT NAME"
}
```

### Step 2: Confirm Transaction

```bash
POST /transactions/pix/cronos/confirm
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "transactionId": "transaction-uuid",
  "transactionalPassword": "1234"
}
```

**Response:**
```json
{
  "id": "transaction-uuid",
  "status": "process",
  "message": "Transaction sent for processing"
}
```

### Step 3: Check Status

```bash
GET /transactions/transaction-uuid
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "id": "transaction-uuid",
  "status": "confirm",
  "completedAt": "2026-01-14T10:05:00.000Z"
}
```

## Related Endpoints

- [Transaction History](../transactions/history.md)
- [Transactional Password](transactional-password.md)
- [PIX Transaction Flow](../flows/pix-transaction-flow.md)

## References

- [Transactions Domain Overview](README.md)
- [Security & Performance](../../operations/security-performance.md)
- [Provider Features](../../operations/provider-features.md)
- [Worker Architecture](../../architecture/worker.md)
