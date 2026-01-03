/**
 * @deprecated Use JwtService instead
 * Mantido apenas para compatibilidade temporária
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtHelper {
  /**
   * @deprecated Use JwtService.generateToken() instead
   */
  static async generateToken(payload: Record<string, unknown>): Promise<string> {
    throw new Error('Use JwtService instead of JwtHelper');
  }

  /**
   * @deprecated Use JwtService.verifyToken() instead
   */
  static async verifyToken(token: string): Promise<Record<string, unknown>> {
    throw new Error('Use JwtService instead of JwtHelper');
  }
}
