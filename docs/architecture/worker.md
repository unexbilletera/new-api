# Worker Architecture

## Overview

The worker processes messages from AWS SQS queue and executes asynchronous operations such as PIX transaction processing and other background jobs.

## Architecture

### Components

- `worker.ts`: Bootstrap and initialization
- `worker.module.ts`: NestJS module configuration
- `worker.service.ts`: Message processing loop and routing
- `handlers/`: Job-specific handlers

### Message Flow

```
SQS Queue → Worker Service → Job Router → Handler → Database
```

1. Worker receives message from SQS (long polling)
2. Parse message to extract `jobType` and `payload`
3. Route to appropriate handler based on `jobType`
4. Handler processes job and updates database
5. Delete message from queue on success
6. Automatic retry on error (message remains in queue)

## Running the Worker

### Development

```bash
npm run start:worker
```

### Production

```bash
npm run build:prod
npm run start:prod:worker
```

## Configuration

### Required Environment Variables

```env
AWS_REGION=us-east-2
SQS_TRANSACTIONS_QUEUE_URL=https://sqs.us-east-2.amazonaws.com/123456789012/transactions-queue
WALLET_MYSQL_URL=mysql://user:password@host:3306/database
NODE_ENV=development|sandbox|production
```

## Supported Job Types

### PIX Cronos Create

Processes PIX Cronos transaction creation.

**Job Type:** `pix_cronos_create`

**Payload:**
```json
{
  "transactionId": "uuid",
  "userId": "uuid",
  "sourceAccountId": "uuid",
  "sourceIdentityId": "uuid",
  "amount": 100.5,
  "targetKeyType": "cpf",
  "targetKeyValue": "12345678900",
  "description": "PIX Transfer"
}
```

### PIX Cronos Confirm

Processes PIX Cronos transaction confirmation.

**Job Type:** `pix_cronos_confirm`

**Payload:**
```json
{
  "transactionId": "uuid",
  "userId": "uuid"
}
```

## Handler Implementation

### Structure

```typescript
@Injectable()
export class PixCronosHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async handleCreate(payload: PixCronosCreatePayload): Promise<void> {
    // Implementation
  }

  async handleConfirm(payload: PixCronosConfirmPayload): Promise<void> {
    // Implementation
  }
}
```

### Adding New Handler

1. Create handler file in `handlers/` directory:
   ```typescript
   // handlers/my-handler.ts
   @Injectable()
   export class MyHandler {
     async handleMyJob(payload: MyJobPayload): Promise<void> {
       // Implementation
     }
   }
   ```

2. Register in `worker.module.ts`:
   ```typescript
   @Module({
     providers: [WorkerService, PixCronosHandler, MyHandler],
   })
   export class WorkerModule {}
   ```

3. Add routing in `worker.service.ts`:
   ```typescript
   private async routeJob(jobType: string, payload: any): Promise<void> {
     switch (jobType) {
       case 'my_job_type':
         await this.myHandler.handleMyJob(payload);
         break;
       // ...
     }
   }
   ```

## Reliability Features

### Long Polling

- 20-second wait time for messages
- Reduces API calls and costs
- Lower latency for message processing

### Automatic Retry

- Failed messages remain in queue
- SQS handles retry logic
- Configurable retry policy and DLQ

### Graceful Shutdown

- Handles SIGTERM and SIGINT signals
- Completes current message processing
- Prevents message loss during deployment

### Job Isolation

- Each job processed independently
- Failure in one job doesn't affect others
- Transaction boundaries per job

## Error Handling

### Strategy

1. Catch and log all errors
2. Don't delete message on error
3. Allow SQS retry mechanism
4. Move to Dead Letter Queue after max retries

### Implementation

```typescript
try {
  await this.processMessage(message);
  await this.deleteMessage(message);
} catch (error) {
  this.logger.error('Job processing failed', {
    error,
    messageId: message.MessageId,
    jobType: message.jobType,
  });
  // Message remains in queue for retry
}
```

## Monitoring

### Key Metrics

- Messages processed per minute
- Processing time per job type
- Error rate by job type
- Queue depth and age

### Logging

All operations logged with:
- Job type and payload
- Processing duration
- Success/failure status
- Error details and stack traces

## Best Practices

1. **Idempotency**: Handlers should be idempotent to handle retries safely
2. **Transactions**: Use database transactions for multi-step operations
3. **Validation**: Validate payload structure before processing
4. **Timeouts**: Set reasonable timeouts for external API calls
5. **Monitoring**: Track metrics and set up alerts for failures

## References

- [Architecture Overview](overview.md)
- [Module Structure](modules.md)
- [Operations Guide](../operations/)
