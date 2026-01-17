# Webhooks

**Status:** `stable`
**Last Updated:** 2026-01-16
**Owner:** Unex Development Team

## Overview

Webhook endpoints for receiving external service notifications. These endpoints handle asynchronous updates from payment providers and other integrated services.

## Endpoints

### Cronos Webhooks
- [Cronos Webhook](cronos-webhook.md) - Transaction status updates from Cronos
  - `POST /api/cronos/webhook`

## Security

All webhook endpoints implement:

1. **Signature Verification**: HMAC-SHA256 signature validation
2. **Raw Body Capture**: Preserves raw request body for signature verification
3. **Idempotency**: Duplicate events are safely ignored
4. **Error Isolation**: Processing errors don't affect response codes

## Implementation Pattern

```typescript
@Controller('api/:provider/webhook')
export class WebhookController {
  @Post()
  async handleWebhook(
    @Req() req: FastifyRequest,
    @Body() payload: WebhookDto,
  ) {
    // 1. Get raw body for signature verification
    const rawBody = (req as any).rawBody;

    // 2. Verify signature
    const signature = req.headers['x-signature'] as string;
    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      throw new UnauthorizedException('Invalid signature');
    }

    // 3. Process webhook
    await this.webhookService.process(payload);

    return { received: true };
  }
}
```

## References

- [Worker Architecture](../../architecture/worker.md)
- [Security & Performance](../../operations/security-performance.md)
