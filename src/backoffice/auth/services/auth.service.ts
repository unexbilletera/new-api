import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BackofficeUserModel } from '../models/backoffice-user.model';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(private backofficeUserModel: BackofficeUserModel) {}

  /**
   * Realiza login do usuário backoffice
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    try {
      return await this.backofficeUserModel.validateCredentials(loginDto);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Erro ao realizar login');
    }
  }

  /**
   * Retorna dados do usuário a partir do ID
   */
  async getUserById(userId: string): Promise<UserResponseDto> {
    const user = await this.backofficeUserModel.findById(userId);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: {
        id: user.backofficeRoles.id,
        name: user.backofficeRoles.name,
        level: user.backofficeRoles.level,
      },
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}

