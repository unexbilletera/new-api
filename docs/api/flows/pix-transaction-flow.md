# PIX Transaction Flow

**Status:** `stable`
**Last Updated:** 2026-01-14
**Owner:** Unex Development Team

## Overview

Complete flow for creating and confirming PIX transactions via Cronos integration.

## Flow Diagram

```
┌─────────────────┐
│  Create Trans   │ POST /transactions/pix/cronos/create
│                 │ ├─ Validates source account
│                 │ ├─ Validates balance
│                 │ ├─ Calls Cronos createPIX
│                 │ └─ Returns transaction ID
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Confirm Trans  │ POST /transactions/pix/cronos/confirm
│                 │ ├─ Validates transaction exists
│                 │ ├─ Validates transactional password
│                 │ ├─ Sends to SQS queue
│                 │ └─ Returns process status
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SQS Worker     │ Background processing
│                 │ ├─ Receives message from queue
│                 │ ├─ Calls Cronos confirmTransfer
│                 │ ├─ Updates transaction status
│                 │ └─ Deletes message from queue
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Completed     │ Transaction completed
│                 │ Status: confirm
└─────────────────┘
```

## Prerequisites

1. User authenticated (JWT token)
2. User has active account
3. Account has sufficient balance
4. User has transactional password set

## Steps

### 1. Create Transaction

**Endpoint:** `POST /transactions/pix/cronos/create`

**Input:**
```json
{
  "sourceAccountId": "uuid",
  "amount": 100.50,
  "targetKeyType": "cpf",
  "targetKeyValue": "12345678900",
  "description": "PIX transfer"
}
```

**Business Rules:**
- Source account must belong to user
- Account must have status `enable`
- Amount must be >= 0.01
- Target key must be valid format

**Output:**
```json
{
  "id": "transaction-uuid",
  "status": "pending",
  "amount": 100.50,
  "targetName": "Recipient Name"
}
```

### 2. Confirm Transaction

**Endpoint:** `POST /transactions/pix/cronos/confirm`

**Input:**
```json
{
  "transactionId": "transaction-uuid",
  "transactionalPassword": "1234"
}
```

**Business Rules:**
- Transaction must exist
- Transaction must have status `pending`
- Transactional password must be correct (4 digits)
- Transaction must belong to authenticated user

**Output:**
```json
{
  "id": "transaction-uuid",
  "status": "process",
  "message": "Transaction sent for processing"
}
```

### 3. Asynchronous Processing

**Worker:** Background SQS worker

**Process:**
1. Receives message from SQS queue
2. Validates transaction still pending
3. Calls Cronos `confirmartransferencia` API
4. Updates transaction status based on response
5. Deletes message from queue

**Possible Outcomes:**
- `confirm`: Successfully completed
- `error`: Processing failed
- `reverse`: Reversed by provider

## SQS Configuration

**Required Environment Variables:**
```env
AWS_REGION=us-east-2
SQS_TRANSACTIONS_QUEUE_URL=https://sqs.us-east-2.amazonaws.com/.../queue
```

**Worker:** Must be running
```bash
npm run start:worker
```

## Error Handling

### Create Transaction Errors
- `400 transactions.errors.invalidSourceAccount` - Account not found/invalid
- `400 transactions.errors.insufficientBalance` - Not enough balance
- `400 transactions.errors.invalidAmount` - Amount too low

### Confirm Transaction Errors
- `400 transactions.errors.invalidId` - Transaction not found
- `401 transactions.errors.invalidTransactionalPassword` - Wrong password
- `400 transactions.errors.invalidStatus` - Transaction not in pending state

## Testing

### Manual Testing
See [PIX Cronos Testing Guide](../../guides/testing-pix-cronos.md)

### cURL Testing
See [Cronos cURL Testing](../../guides/testing-cronos-curl.md)

### Automated Testing
```bash
npm run test:e2e -- pix-transaction.e2e-spec.ts
```

## Monitoring

Key metrics to monitor:
- Transaction creation rate
- Confirmation success rate
- Average processing time
- SQS queue depth
- Worker processing lag

## References

- [Transactions Domain](../transactions/README.md)
- [Worker Architecture](../../architecture/worker.md)
- [Provider Features](../../operations/provider-features.md)
- [PIX Cronos Documentation](../transactions/pix-cronos.md)
