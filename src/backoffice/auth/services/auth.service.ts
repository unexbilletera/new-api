import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BackofficeUserModel } from '../models/backoffice-user.model';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { ErrorCodes, ErrorHelper } from '../../../shared/errors/app-error';
import { BruteForceService } from '../../../shared/security/brute-force.service';

@Injectable()
export class AuthService {
  constructor(
    private backofficeUserModel: BackofficeUserModel,
    private bruteForceService: BruteForceService,
  ) {}
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const identifier = (loginDto.email || '').toLowerCase().trim();

    const bruteForceCheck = await this.bruteForceService.checkAttempt(identifier, undefined, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      lockoutDurationMs: 30 * 60 * 1000,
    });

    if (!bruteForceCheck.allowed) {
      throw new HttpException('backoffice.errors.tooManyAttempts', HttpStatus.TOO_MANY_REQUESTS);
    }

    try {
      const response = await this.backofficeUserModel.validateCredentials(loginDto);
      await this.bruteForceService.clearAttempts(identifier);
      return response;
    } catch (error) {
      await this.bruteForceService.recordFailure(identifier);
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

