import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtHelper {
  static async generateToken(payload: Record<string, unknown>): Promise<string> {
    throw new Error('Use JwtService instead of JwtHelper');
  }
  static async verifyToken(token: string): Promise<Record<string, unknown>> {
    throw new Error('Use JwtService instead of JwtHelper');
  }
}
