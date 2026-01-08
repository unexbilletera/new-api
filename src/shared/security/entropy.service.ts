import { randomBytes, createHash } from 'crypto';

export class EntropyService {
  static generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  static generateSecureCode(length: number = 6): string {
    if (length < 4 || length > 10) {
      throw new Error('Code length must be between 4 and 10 digits');
    }

    const max = Math.pow(10, length) - 1;
    const randomValue = randomBytes(4).readUInt32BE(0);
    const code = (randomValue % (max + 1)).toString().padStart(length, '0');
    
    return code;
  }

  static generateSecureUUID(): string {
    const bytes = randomBytes(16);
    
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return [
      bytes.toString('hex', 0, 4),
      bytes.toString('hex', 4, 6),
      bytes.toString('hex', 6, 8),
      bytes.toString('hex', 8, 10),
      bytes.toString('hex', 10, 16),
    ].join('-');
  }

  static generateChallenge(length: number = 32): string {
    const bytes = randomBytes(length);
    return bytes
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  static hashChallenge(challenge: string): string {
    const hash = createHash('sha256').update(challenge).digest();
    return hash
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  static generateNonce(length: number = 16): string {
    return randomBytes(length).toString('hex');
  }

  static generateSalt(length: number = 16): string {
    return randomBytes(length).toString('hex');
  }

  static hasSufficientEntropy(token: string, minEntropyBits: number = 128): boolean {
    if (!token || token.length === 0) {
      return false;
    }

    const uniqueChars = new Set(token).size;
    const length = token.length;
    
    const entropyBits = length * Math.log2(uniqueChars || 1);

    return entropyBits >= minEntropyBits;
  }

  static generateTOTPSeed(userId: string, secret: string): string {
    const combined = `${userId}:${secret}:${Date.now()}`;
    const hash = createHash('sha256').update(combined).digest('hex');
    const random = randomBytes(16).toString('hex');
    
    return `${hash}:${random}`;
  }

  static generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }
}
