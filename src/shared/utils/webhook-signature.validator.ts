import * as crypto from 'crypto';

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256',
): boolean {
  if (!payload || !signature || !secret) {
    return false;
  }

  try {
    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payloadString)
      .digest('hex');

    const signatureToCompare = signature.startsWith('sha256=')
      ? signature.slice(7)
      : signature.startsWith('sha512=')
        ? signature.slice(7)
        : signature;

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signatureToCompare, 'hex'),
    );
  } catch {
    return false;
  }
}

export function generateWebhookSignature(
  payload: string | object,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256',
): string {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac(algorithm, secret).update(payloadString).digest('hex');
}
