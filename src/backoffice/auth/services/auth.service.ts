import { Injectable } from '@nestjs/common';
import { BackofficeUserModel } from '../models/backoffice-user.model';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { ErrorCodes, ErrorHelper } from '../../../shared/errors/app-error';

@Injectable()
export class AuthService {
  constructor(private backofficeUserModel: BackofficeUserModel) {}
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    try {
      return await this.backofficeUserModel.validateCredentials(loginDto);
    } catch (error) {
      // Se já for um AppError, re-lançar
      if (error && typeof error === 'object' && 'getStatus' in error) {
        throw error;
      }
      throw ErrorHelper.unauthorized(ErrorCodes.BACKOFFICE_INVALID_CREDENTIALS);
    }
  }
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

