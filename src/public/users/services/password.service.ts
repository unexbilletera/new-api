import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserModel } from '../models/user.model';
import { PasswordHelper } from '../../../shared/helpers/password.helper';
import { AccessLogService } from '../../../shared/access-log/access-log.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { UserMapper } from '../mappers/user.mapper';
import { ChangePasswordDto } from '../dto/user-profile.dto';
import { PasswordChangeResponseDto } from '../dto/response';

@Injectable()
export class PasswordService {
  constructor(
    private userModel: UserModel,
    private accessLogService: AccessLogService,
    private logger: LoggerService,
    private userMapper: UserMapper,
  ) {}

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    requestContext?: { ipAddress?: string; userAgent?: string },
  ): Promise<PasswordChangeResponseDto> {
    this.logger.info('[PASSWORD] Password change requested', { userId });

    if (!dto.currentPassword || !dto.newPassword) {
      throw new BadRequestException(
        'users.errors.currentPasswordAndNewPasswordRequired',
      );
    }

    if (!dto.newPassword.match(/^\d{6}$/)) {
      throw new BadRequestException('users.errors.invalidPassword');
    }

    const user = await this.userModel.findByIdWithValidStatus(userId);

    if (!user.password) {
      this.logger.warn('[PASSWORD] User has no password set', { userId });
      throw new BadRequestException('users.errors.passwordNotSet');
    }

    const isCurrentPasswordValid = await PasswordHelper.compare(
      dto.currentPassword.trim(),
      user.password,
    );

    if (!isCurrentPasswordValid) {
      this.logger.warn('[PASSWORD] Invalid current password', { userId });
      await this.accessLogService.logFailure({
        userId: user.id,
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });
      throw new UnauthorizedException('users.errors.invalidCurrentPassword');
    }

    if (dto.currentPassword.trim() === dto.newPassword.trim()) {
      throw new BadRequestException('users.errors.newPasswordMustBeDifferent');
    }

    const hashedNewPassword = await PasswordHelper.hash(dto.newPassword.trim());

    await this.userModel.changePassword(userId, hashedNewPassword);

    await this.accessLogService.logSuccess({
      userId: user.id,
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
    });

    this.logger.info('[PASSWORD] Password changed successfully', { userId });

    return this.userMapper.toPasswordChangeResponseDto();
  }
}
