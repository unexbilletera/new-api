import { Injectable, BadRequestException } from '@nestjs/common';
import { AuthUserModel } from '../models/user.model';
import { SmsService } from '../../../shared/sms/sms.service';
import { AuthMapper } from '../mappers/auth.mapper';
import {
  SendPhoneValidationDto,
  VerifyPhoneCodeDto,
} from '../dto/phone-validation.dto';

@Injectable()
export class PhoneValidationService {
  constructor(
    private userModel: AuthUserModel,
    private smsService: SmsService,
    private authMapper: AuthMapper,
  ) {}

  async sendPhoneValidation(dto: SendPhoneValidationDto) {
    const result = await this.smsService.sendValidationCode(
      dto.phone,
      6,
      5,
      'sms',
    );

    return this.authMapper.toPhoneValidationResponseDto(
      result.message,
      result.debug,
    );
  }

  async verifyPhoneCode(dto: VerifyPhoneCodeDto) {
    try {
      const result = await this.smsService.verifyCode(
        dto.phone,
        dto.code,
        true,
      );

      const normalizedPhone = this.smsService.normalizePhone(dto.phone);
      const user = await this.userModel.findByUsername(normalizedPhone);

      if (user) {
        await this.userModel.updatePhoneVerified(normalizedPhone);
      }

      return this.authMapper.toPhoneCodeVerificationResponseDto(
        result.message,
        result.phone,
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
