# Billet Cronos Transactions

**Status:** `stable`
**Last Updated:** 2026-01-16
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Billet (boleto) payment processing via Cronos API integration. Supports consulting billet details and confirming payments with transactional password security.

## Code References

**Controller:** `src/secure/transactions/billet-cronos/controllers/billet-cronos.controller.ts`
**Service:** `src/secure/transactions/billet-cronos/services/billet-cronos.service.ts`
**Model:** `src/secure/transactions/billet-cronos/models/billet-cronos-transaction.model.ts`

## Endpoints

### POST /transactions/billet/cronos/create

Consult billet details and create a pending payment transaction.

**Status:** `stable`
**Auth:** Required (JWT)

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer JWT token |
| `Content-Type` | Yes | `application/json` |

#### Request Body

**Required:**
- `sourceAccountId` (string): Source account UUID
- `barcode` (string): Billet barcode (47 or 48 digits)

**Optional:**
- `amount` (number): Payment amount (if different from billet value, minimum 0.01)
- `description` (string): Payment description

#### Request Example

```json
{
  "sourceAccountId": "uuid-da-conta-origem",
  "barcode": "23793.38128 60000.000003 00000.000408 1 84340000012345",
  "description": "Billet payment"
}
```

#### Success Response (200)

```json
{
  "id": "uuid-da-transacao",
  "status": "pending",
  "amount": 123.45,
  "createdAt": "2026-01-16T10:00:00.000Z",
  "billetDetails": {
    "beneficiaryName": "COMPANY NAME",
    "beneficiaryDocument": "12345678000199",
    "dueDate": "2026-01-20",
    "originalValue": 123.45,
    "discount": 0,
    "interest": 0,
    "fine": 0,
    "payableValue": 123.45
  },
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

**400 - Invalid Barcode**
```json
{
  "error": "400 transactions.errors.invalidBilletBarcode",
  "message": "Invalid billet barcode format",
  "code": 400
}
```

**400 - Billet Not Found**
```json
{
  "error": "400 transactions.errors.billetNotFound",
  "message": "Billet not found or expired",
  "code": 400
}
```

#### Code Flow

```
BilletCronosController.create()
  └─> BilletCronosService.createTransaction()
      ├─> AccountModel.findById()  // Validate source account
      │   └─> prisma.accounts.findFirst()
      ├─> AccountModel.validateBalance()  // Check balance
      ├─> CronosService.consultBillet()  // Fetch billet data
      │   └─> HTTP POST to Cronos API
      └─> BilletCronosTransactionModel.create()
          └─> prisma.transactions.create()
```

---

### POST /transactions/billet/cronos/confirm

Confirm pending billet payment with transactional password.

**Status:** `stable`
**Auth:** Required (JWT)

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

#### Code Flow

```
BilletCronosController.confirm()
  └─> BilletCronosService.confirmTransaction()
      ├─> BilletCronosTransactionModel.findById()  // Validate transaction
      │   └─> prisma.transactions.findFirst()
      ├─> TransactionalPasswordService.validate()  // Check password
      │   └─> bcrypt.compare()
      ├─> BilletCronosTransactionModel.updateStatus()  // Set to "process"
      │   └─> prisma.transactions.update()
      └─> SQSService.sendTransactionMessage()  // Send to queue
          └─> AWS SQS sendMessage()
```

---

## Barcode Format

Supported billet barcode formats:

| Type | Length | Description |
|------|--------|-------------|
| Standard | 47 digits | Bank billet (boleto bancario) |
| Utility | 48 digits | Utility bills (concessionarias) |

## Business Rules

1. **Source Account Validation**: Account must belong to authenticated user
2. **Account Status**: Source account must have status `enable`
3. **Balance Check**: Account must have sufficient balance for payment amount
4. **Minimum Amount**: Payments must be >= 0.01
5. **Transaction Status**: Only `pending` transactions can be confirmed
6. **Transactional Password**: Required if user has one configured
7. **Billet Validation**: Barcode must be valid and billet must not be expired
8. **Rate Limiting**: 10 requests/minute per user

## Transaction Status Flow

```
pending → process → confirm
         ↓
       error
```

- **pending**: Transaction created, awaiting confirmation
- **process**: Confirmation received, processing via SQS
- **confirm**: Successfully completed by Cronos
- **error**: Failed during processing

## Asynchronous Processing

After confirmation, transaction is sent to SQS queue for processing:

1. **Queue**: Transaction sent to `SQS_TRANSACTIONS_QUEUE_URL`
2. **Worker**: Background worker processes queue messages
3. **Cronos API**: Worker calls Cronos billet payment endpoint
4. **Status Update**: Transaction status updated based on response
5. **Notification**: User notified of completion/failure

## Security Features

- JWT authentication required
- Source account ownership validation
- Transactional password security (4-digit PIN)
- Rate limiting on endpoints
- Audit logging for all operations
- Barcode validation

## Error Codes

- `400 transactions.errors.invalidSourceAccount` - Account not found/invalid
- `400 transactions.errors.insufficientBalance` - Not enough balance
- `400 transactions.errors.invalidBilletBarcode` - Invalid barcode format
- `400 transactions.errors.billetNotFound` - Billet not found or expired
- `400 transactions.errors.billetExpired` - Billet has expired
- `400 transactions.errors.invalidId` - Transaction not found
- `400 transactions.errors.invalidStatus` - Transaction not pending
- `401 transactions.errors.invalidTransactionalPassword` - Wrong password
- `404 transactions.errors.transactionalPasswordRequired` - Password required

## Complete Flow Example

### Step 1: Create Transaction (Consult Billet)

```bash
POST /transactions/billet/cronos/create
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "sourceAccountId": "account-uuid",
  "barcode": "23793381286000000000300000000408184340000012345"
}
```

**Response:**
```json
{
  "id": "transaction-uuid",
  "status": "pending",
  "amount": 123.45,
  "billetDetails": {
    "beneficiaryName": "COMPANY NAME",
    "dueDate": "2026-01-20"
  }
}
```

### Step 2: Confirm Transaction

```bash
POST /transactions/billet/cronos/confirm
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
  "completedAt": "2026-01-16T10:05:00.000Z"
}
```

## Related Endpoints

- [PIX Cronos Transactions](pix-cronos.md)
- [Transaction History](../transactions/history.md)
- [Transactional Password](transactional-password.md)

## References

- [Transactions Domain Overview](README.md)
- [Security & Performance](../../operations/security-performance.md)
- [Provider Features](../../operations/provider-features.md)
- [Worker Architecture](../../architecture/worker.md)
