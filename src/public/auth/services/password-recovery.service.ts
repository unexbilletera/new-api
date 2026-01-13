import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
const bcrypt = require('bcrypt');
import { AuthUserModel } from '../models/user.model';
import { PasswordHelper } from '../../../shared/helpers/password.helper';
import { JwtService, JwtPayload } from '../../../shared/jwt/jwt.service';
import { NotificationService } from '../../../shared/notifications/notifications.service';
import { AccessLogService } from '../../../shared/access-log/access-log.service';
import { SystemVersionService } from '../../../shared/helpers/system-version.service';
import { AuthMapper } from '../mappers/auth.mapper';
import {
  ForgotPasswordDto,
  VerifyPasswordDto,
  UnlockAccountDto,
} from '../dto/password-recovery.dto';

@Injectable()
export class PasswordRecoveryService {
  constructor(
    private userModel: AuthUserModel,
    private jwtService: JwtService,
    private notificationService: NotificationService,
    private accessLogService: AccessLogService,
    private systemVersionService: SystemVersionService,
    private authMapper: AuthMapper,
  ) {}

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private generateNumericCode(length = 8): string {
    return parseInt(randomBytes(length).toString('hex'), 16)
      .toString()
      .substring(0, length)
      .padStart(length, '0');
  }

  private async hashCode(code: string): Promise<string> {
    return bcrypt.hash(code, 10);
  }

  private async isCodeValid(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.userModel.findByEmail(email);

    if (!user) {
      return { message: 'If email exists, password reset code will be sent' };
    }

    const code = this.generateNumericCode(8);
    const hashed = await this.hashCode(code);

    await this.userModel.storeRecoveryCode(email, hashed);

    await this.notificationService.sendPasswordRecovery(
      email,
      code,
      user.language,
    );

    return this.authMapper.toForgotPasswordResponseDto(
      'Password reset code sent to email',
    );
  }

  async verifyPassword(dto: VerifyPasswordDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.userModel.findByEmail(email);

    if (!user || !user.recovery) {
      throw new BadRequestException('User not found');
    }

    const isValid = await this.isCodeValid(dto.code, user.recovery);
    if (!isValid) {
      throw new BadRequestException('Invalid code');
    }

    const hashedPassword = await PasswordHelper.hash(dto.newPassword);

    await this.userModel.updatePassword(user.id, hashedPassword);

    return this.authMapper.toVerifyPasswordResponseDto(
      'Password updated successfully',
    );
  }

  async unlockAccount(
    dto: UnlockAccountDto,
    requestContext?: { ipAddress?: string; userAgent?: string },
  ) {
    if (!dto.id || dto.id.length > 255) {
      throw new BadRequestException('users.errors.invalidId');
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    if (!uuidRegex.test(dto.id)) {
      throw new BadRequestException('users.errors.invalidId');
    }

    if (!dto.password || dto.password.trim().length === 0) {
      throw new BadRequestException('users.errors.invalidPassword');
    }

    const user = await this.userModel.findByIdWithValidStatus(dto.id);

    if (!user.password) {
      throw new UnauthorizedException('users.errors.invalidUsernameOrPassword');
    }

    const isPasswordValid = await PasswordHelper.compare(
      dto.password.trim(),
      user.password,
    );

    if (!isPasswordValid) {
      await this.accessLogService.logFailure({
        userId: user.id,
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });
      throw new UnauthorizedException('users.errors.invalidUsernameOrPassword');
    }

    try {
      this.systemVersionService.assertVersionValid(dto.systemVersion);
    } catch (versionError) {
      throw new BadRequestException(
        versionError instanceof Error
          ? versionError.message
          : 'users.errors.invalidSystemVersion',
      );
    }

    if (user.status === 'disable') {
      await this.userModel.unlockAccount(dto.id);

      await this.accessLogService.logSuccess({
        userId: user.id,
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });

      const updatedUser = await this.userModel.findByIdSelect(user.id);

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email || '',
        roleId: user.id,
      };

      const token = await this.jwtService.generateToken(payload);

      return this.authMapper.toUnlockAccountResponseDto(updatedUser, token);
    }

    throw new BadRequestException('users.errors.accountNotLocked');
  }
}
