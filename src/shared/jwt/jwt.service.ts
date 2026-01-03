import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

export interface JwtPayload {
  userId: string;
  email: string;
  roleId: string;
}

@Injectable()
export class JwtService {
  constructor(private jwtService: NestJwtService) {}

  /**
   * Gera token JWT
   */
  async generateToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  /**
   * Valida e decodifica token JWT
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
}

