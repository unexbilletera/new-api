# Cronos Webhook

**Status:** `stable`
**Last Updated:** 2026-01-16
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Webhook endpoint for receiving transaction status updates from Cronos API. Handles PIX cash-in, PIX cash-out, and billet payment notifications.

## Code References

**Controller:** `src/webhooks/cronos/controllers/cronos-webhook.controller.ts`
**Service:** `src/webhooks/cronos/services/cronos-webhook.service.ts`
**Module:** `src/webhooks/cronos/cronos-webhook.module.ts`

## Endpoint

### POST /api/cronos/webhook

Receive transaction status notifications from Cronos.

**Status:** `stable`
**Auth:** HMAC Signature Verification

#### Headers

```
Content-Type: application/json
X-Cronos-Signature: {hmac-signature}
```

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `X-Cronos-Signature` | Yes | HMAC-SHA256 signature of the request body |

#### Signature Verification

The webhook uses HMAC-SHA256 signature verification:

```typescript
const expectedSignature = crypto
  .createHmac('sha256', CRONOS_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');

if (receivedSignature !== expectedSignature) {
  throw new UnauthorizedException('Invalid signature');
}
```

#### Request Body

```json
{
  "event": "transaction.updated",
  "transactionId": "cronos-transaction-id",
  "status": "completed",
  "type": "pix_cashout",
  "timestamp": "2026-01-16T10:00:00.000Z",
  "data": {
    "amount": 100.50,
    "endToEndId": "E12345678202601161000abc123def456"
  }
}
```

**Fields:**
- `event` (string): Event type
  - `transaction.updated`: Transaction status changed
  - `transaction.completed`: Transaction completed successfully
  - `transaction.failed`: Transaction failed
- `transactionId` (string): Cronos transaction ID
- `status` (string): New transaction status
  - `completed`: Successfully processed
  - `failed`: Processing failed
  - `reversed`: Transaction reversed
- `type` (string): Transaction type
  - `pix_cashin`: Incoming PIX transfer
  - `pix_cashout`: Outgoing PIX transfer
  - `billet_payment`: Billet payment
- `timestamp` (string): ISO 8601 timestamp
- `data` (object): Additional transaction data

#### Success Response (200)

```json
{
  "received": true
}
```

#### Error Responses

**401 - Invalid Signature**
```json
{
  "error": "Unauthorized",
  "message": "Invalid webhook signature",
  "statusCode": 401
}
```

**400 - Invalid Payload**
```json
{
  "error": "Bad Request",
  "message": "Invalid webhook payload",
  "statusCode": 400
}
```

## Event Types

### PIX Cash-In (pix_cashin)

Incoming PIX transfer received.

**Processing:**
1. Find user by tax document number
2. Credit amount to user's account
3. Create transaction record with status `confirm`
4. Send notification to user

```json
{
  "event": "transaction.completed",
  "type": "pix_cashin",
  "data": {
    "amount": 500.00,
    "senderName": "SENDER NAME",
    "senderDocument": "12345678900",
    "endToEndId": "E12345678202601161000abc123def456"
  }
}
```

### PIX Cash-Out (pix_cashout)

Outgoing PIX transfer status update.

**Processing:**
1. Find transaction by Cronos ID
2. Update transaction status (`confirm` or `error`)
3. If failed, reverse balance deduction
4. Send notification to user

```json
{
  "event": "transaction.completed",
  "type": "pix_cashout",
  "data": {
    "amount": 100.50,
    "endToEndId": "E12345678202601161000abc123def456"
  }
}
```

### Billet Payment (billet_payment)

Billet payment status update.

**Processing:**
1. Find transaction by Cronos ID
2. Update transaction status (`confirm` or `error`)
3. If failed, reverse balance deduction
4. Send notification to user

```json
{
  "event": "transaction.completed",
  "type": "billet_payment",
  "data": {
    "amount": 250.00,
    "barcode": "23793381286000000000300000000408184340000025000",
    "authenticationCode": "ABC123DEF456"
  }
}
```

## Code Flow

```
CronosWebhookController.handleWebhook()
  ├─> verifyWebhookSignature()  // Validate HMAC signature
  │   └─> crypto.createHmac('sha256', secret)
  └─> CronosWebhookService.processWebhook()
      ├─> processPixCashin()  // For pix_cashin events
      │   ├─> findUserByDocument()
      │   ├─> creditAccount()
      │   └─> createTransaction()
      ├─> processPixCashout()  // For pix_cashout events
      │   ├─> findTransactionByCronosId()
      │   └─> updateTransactionStatus()
      └─> processBilletPayment()  // For billet_payment events
          ├─> findTransactionByCronosId()
          └─> updateTransactionStatus()
```

## Security

### Signature Verification

All webhook requests must include a valid HMAC-SHA256 signature in the `X-Cronos-Signature` header. The signature is computed over the raw request body.

### Raw Body Capture

The application captures raw request body for webhook routes to enable signature verification:

```typescript
// main.ts - Raw body capture for webhooks
instance.addHook('preParsing', async (request, _reply, payload) => {
  if (request.url && request.url.includes('/webhook')) {
    const chunks: Buffer[] = [];
    for await (const chunk of payload) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks).toString('utf8');
    request.rawBody = rawBody;
    return Buffer.from(rawBody);
  }
  return payload;
});
```

### Environment Variables

```env
CRONOS_WEBHOOK_SECRET=your-webhook-secret
```

## Idempotency

Webhook processing is idempotent:
- Duplicate events with the same `transactionId` are ignored
- Transaction status is only updated if the new status is valid
- Balance operations use database transactions

## Error Handling

- Invalid signatures are rejected with 401
- Unknown transaction IDs are logged and ignored
- Processing errors are logged but return 200 to prevent retries

## Retry Policy

Cronos retries failed webhook deliveries:
- Maximum 5 retry attempts
- Exponential backoff (1min, 5min, 30min, 2h, 12h)
- Webhook is considered failed if no 2xx response

## Testing

### Local Testing with ngrok

```bash
# Start ngrok tunnel
ngrok http 3000

# Update webhook URL in Cronos dashboard
# Use the ngrok URL: https://xxxx.ngrok.io/api/cronos/webhook
```

### Manual Testing

```bash
# Generate signature
SECRET="your-webhook-secret"
BODY='{"event":"transaction.completed","type":"pix_cashout","transactionId":"test-123"}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# Send test webhook
curl -X POST http://localhost:3000/api/cronos/webhook \
  -H "Content-Type: application/json" \
  -H "X-Cronos-Signature: $SIGNATURE" \
  -d "$BODY"
```

## Related

- [PIX Cronos Transactions](../transactions/pix-cronos.md)
- [Billet Cronos Transactions](../transactions/billet-cronos.md)
- [Security & Performance](../../operations/security-performance.md)
