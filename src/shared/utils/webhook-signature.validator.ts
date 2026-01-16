import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Valida assinatura de webhook usando HMAC-SHA256
 * @param rawBody - Raw body da requisição (string ou Buffer)
 * @param signature - Assinatura recebida no header x-signature
 * @param secret - Secret compartilhado (webhookSecret)
 * @returns true se assinatura é válida, false caso contrário
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string,
): boolean {
  if (!secret) {
    throw new Error('Webhook secret is not configured');
  }

  if (!signature) {
    throw new Error('Missing webhook signature');
  }

  if (!rawBody) {
    throw new Error('Raw body not available for signature verification');
  }

  // Calcular HMAC-SHA256
  const hmac = createHmac('sha256', secret);
  hmac.update(rawBody);
  const expectedSignature = hmac.digest('hex');

  // Comparar assinaturas usando timingSafeEqual para prevenir timing attacks
  const sigBuffer = Buffer.from(signature, 'utf8');
  const expectedSigBuffer = Buffer.from(expectedSignature, 'utf8');

  if (
    sigBuffer.length !== expectedSigBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedSigBuffer)
  ) {
    return false;
  }

  return true;
}
