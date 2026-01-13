import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UserModel } from '../models/user.model';
import { EmailService } from '../../../shared/email/email.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { UserMapper } from '../mappers/user.mapper';
import {
  RequestEmailChangeDto,
  ConfirmEmailChangeDto,
} from '../dto/user-profile.dto';
import {
  EmailChangeRequestResponseDto,
  EmailChangeConfirmResponseDto,
} from '../dto/response';

@Injectable()
export class EmailChangeService {
  constructor(
    private userModel: UserModel,
    private emailService: EmailService,
    private logger: LoggerService,
    private userMapper: UserMapper,
  ) {}

  async requestEmailChange(
    userId: string,
    dto: RequestEmailChangeDto,
  ): Promise<EmailChangeRequestResponseDto> {
    this.logger.info('[EMAIL CHANGE] Requesting email change', {
      userId,
      newEmail: dto.newEmail,
    });

    const emailRegex =
      /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!dto.newEmail || !emailRegex.test(dto.newEmail)) {
      throw new BadRequestException('users.errors.invalidEmail');
    }

    const user = await this.userModel.findByIdSimple(userId);
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const normalizedNewEmail = dto.newEmail.toLowerCase().trim();
    if (user.email && user.email.toLowerCase().trim() === normalizedNewEmail) {
      throw new BadRequestException('users.errors.emailAlreadyInUse');
    }

    const exists = await this.userModel.findByEmailExcluding(
      normalizedNewEmail,
      userId,
    );
    if (exists) {
      throw new BadRequestException('users.errors.duplicatedEmail');
    }

    const sendResult = await this.emailService.sendValidationCode(
      normalizedNewEmail,
      8,
      10,
      false,
    );

    const tokenPayload = {
      type: 'email_change',
      newEmail: normalizedNewEmail,
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };

    const notes =
      (user.notes || '') +
      `${new Date().toISOString()} - EMAIL CHANGE REQUESTED to: ${normalizedNewEmail}\n`;

    await this.userModel.updateEmailChangeRequest(
      userId,
      JSON.stringify(tokenPayload),
      notes,
    );

    return this.userMapper.toEmailChangeRequestResponseDto(
      normalizedNewEmail,
      sendResult.expiresIn,
    );
  }

  async confirmEmailChange(
    userId: string,
    dto: ConfirmEmailChangeDto,
  ): Promise<EmailChangeConfirmResponseDto> {
    this.logger.info('[EMAIL CHANGE] Confirming email change', {
      userId,
      newEmail: dto.newEmail,
    });

    const user = await this.userModel.findByIdSimple(userId);
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const tokenStr = user.verifyToken || '';
    let token: any = null;
    try {
      token = tokenStr ? JSON.parse(tokenStr) : null;
    } catch {
      token = null;
    }

    if (!token || token.type !== 'email_change') {
      throw new BadRequestException('users.errors.noPendingEmailChange');
    }

    const normalizedNewEmail = dto.newEmail.toLowerCase().trim();
    if (normalizedNewEmail !== token.newEmail) {
      throw new BadRequestException('users.errors.invalidEmailChangeRequest');
    }

    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      throw new BadRequestException('users.errors.codeExpired');
    }

    await this.emailService.verifyCode(normalizedNewEmail, dto.code, false);

    const exists = await this.userModel.findByEmailExcluding(
      normalizedNewEmail,
      userId,
    );
    if (exists) {
      throw new BadRequestException('users.errors.duplicatedEmail');
    }

    const notes =
      (user.notes || '') +
      `${new Date().toISOString()} - EMAIL CHANGED from: ${user.email || ''} to: ${normalizedNewEmail}\n`;

    await this.userModel.confirmEmailChange(userId, normalizedNewEmail, notes);

    return this.userMapper.toEmailChangeConfirmResponseDto(normalizedNewEmail);
  }
}
