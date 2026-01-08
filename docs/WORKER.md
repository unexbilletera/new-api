# Worker - SQS Message Processing

This worker processes messages from AWS SQS queue and executes asynchronous actions (like processing PIX transactions).

## Structure

- `worker.ts`: Main file that starts the worker
- `worker.module.ts`: NestJS worker module
- `worker.service.ts`: Main service that manages processing loop
- `handlers/`: Directory with handlers for each job type
  - `pix-cronos.handler.ts`: Handler for PIX Cronos jobs

## Running

### Development
```bash
npm run start:worker
```

### Production
```bash
npm run build:prod
npm run start:prod:worker
```

## Required Environment Variables

```env
AWS_REGION=us-east-2
SQS_TRANSACTIONS_QUEUE_URL=https://sqs.us-east-2.amazonaws.com/123456789012/transactions-queue
WALLET_MYSQL_URL=mysql://user:password@host:3306/database
NODE_ENV=development|sandbox|production
```

## Supported Job Types

### `pix_cronos_create`
Processes PIX Cronos transaction creation.

**Payload:**
```json
{
  "transactionId": "uuid",
  "userId": "uuid",
  "sourceAccountId": "uuid",
  "sourceIdentityId": "uuid",
  "amount": 100.50,
  "targetKeyType": "cpf",
  "targetKeyValue": "12345678900",
  "description": "PIX Transfer"
}
```

### `pix_cronos_confirm`
Processes PIX Cronos transaction confirmation.

**Payload:**
```json
{
  "transactionId": "uuid",
  "userId": "uuid"
}
```

## Processing Flow

1. Worker receives message from SQS queue (long polling)
2. Parse message to extract `jobType` and `payload`
3. Route to appropriate handler based on `jobType`
4. Process job by handler
5. Delete message from queue if processing successful
6. Automatic retry if error (message remains in queue)

## Adding New Handler

1. Create file in `handlers/` (e.g., `my-handler.ts`)
2. Implement class with methods for each job type
3. Add handler in `worker.module.ts`
4. Add routing in `worker.service.ts` method `routeJob()`

## Notes

- Long polling (20 seconds) to reduce costs and latency
- Retry: Messages with errors remain in queue for automatic retry
- Graceful shutdown: Worker handles SIGTERM/SIGINT signals
- Isolation: Each job is processed independently
