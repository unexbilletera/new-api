import { Injectable, BadRequestException } from '@nestjs/common';
import { AuthUserModel } from '../models/user.model';
import { EmailService } from '../../../shared/email/email.service';
import { AuthMapper } from '../mappers/auth.mapper';
import { SendEmailValidationDto, VerifyEmailCodeDto } from '../dto/email-validation.dto';

@Injectable()
export class EmailValidationService {
  constructor(
    private userModel: AuthUserModel,
    private emailService: EmailService,
    private authMapper: AuthMapper,
  ) {}

  async sendEmailValidation(dto: SendEmailValidationDto) {
    const result = await this.emailService.sendValidationCode(
      dto.email,
      8,
      5,
      true,
    );

    return this.authMapper.toEmailValidationResponseDto(result.message, result.debug);
  }

  async verifyEmailCode(dto: VerifyEmailCodeDto) {
    try {
      const result = await this.emailService.verifyCode(dto.email, dto.code, true);

      // Update user email verified at
      const normalizedEmail = this.emailService.normalizeEmail(dto.email);
      const user = await this.userModel.findByEmail(normalizedEmail);

      if (user) {
        await this.userModel.updateEmailVerified(normalizedEmail);
      }

      return this.authMapper.toEmailCodeVerificationResponseDto(result.message, result.email);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
