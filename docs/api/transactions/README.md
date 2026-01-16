# Transactions Domain

**Status:** `stable`
**Last Updated:** 2026-01-14
**Owner:** Unex Development Team

## Overview

The transactions domain handles all financial operations including PIX transfers, payments, and transaction history.

## Endpoints

### PIX Cronos
- [PIX Cronos Transactions](pix-cronos.md) - Create and confirm PIX transactions
  - `POST /transactions/pix/cronos/create`
  - `POST /transactions/pix/cronos/confirm`

### Transaction History
- `GET /transactions/history` - List user transactions
- `GET /transactions/:id` - Get transaction details

## Transaction Flow

```
Create → Confirm → Process (SQS Worker) → Complete
```

See [PIX Transaction Flow](../../flows/pix-transaction-flow.md) for details.

## Transaction Status

- `pending`: Created, awaiting confirmation
- `process`: Confirmed, being processed
- `confirm`: Completed successfully
- `reverse`: Reversed/refunded
- `cancel`: Cancelled
- `error`: Processing error

## Security

- 4-digit transactional password required
- Source account validation
- Balance verification
- Rate limiting

## Testing

- [PIX Cronos Testing](../../guides/testing-pix-cronos.md)
- [Cronos cURL Testing](../../guides/testing-cronos-curl.md)

## References

- [Worker Architecture](../../architecture/worker.md)
- [Provider Features](../../operations/provider-features.md)
