import { Controller, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { SignupService } from '../services/signup.service';
import { SigninService } from '../services/signin.service';
import { EmailValidationService } from '../services/email-validation.service';
import { PhoneValidationService } from '../services/phone-validation.service';
import { PasswordRecoveryService } from '../services/password-recovery.service';
import { TokenService } from '../services/token.service';
import { SignupDto } from '../dto/signup.dto';
import { SigninDto } from '../dto/signin.dto';
import { SendEmailValidationDto, VerifyEmailCodeDto } from '../dto/email-validation.dto';
import { SendPhoneValidationDto, VerifyPhoneCodeDto } from '../dto/phone-validation.dto';
import { ForgotPasswordDto, VerifyPasswordDto, UnlockAccountDto } from '../dto/password-recovery.dto';
import {
  SignupResponseDto,
  SignupDeviceRequiredResponseDto,
  SigninResponseDto,
  SigninDeviceRequiredResponseDto,
  EmailValidationResponseDto,
  EmailCodeVerificationResponseDto,
  PhoneValidationResponseDto,
  PhoneCodeVerificationResponseDto,
  ForgotPasswordResponseDto,
  VerifyPasswordResponseDto,
  UnlockAccountResponseDto,
  TokenResponseDto,
} from '../dto/response';

@Controller('api/users')
export class AuthController {
  constructor(
    private signupService: SignupService,
    private signinService: SigninService,
    private emailValidationService: EmailValidationService,
    private phoneValidationService: PhoneValidationService,
    private passwordRecoveryService: PasswordRecoveryService,
  ) {}

  @Post('user/signup')
  async signup(@Body() dto: SignupDto): Promise<SignupResponseDto | SignupDeviceRequiredResponseDto> {
    return this.signupService.signup(dto);
  }

  @Post('user/signin')
  async signin(@Body() dto: SigninDto, @Req() req: Request): Promise<SigninResponseDto | SigninDeviceRequiredResponseDto> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.signinService.signin(dto, { ipAddress, userAgent });
  }

  @Post('user/sendEmailValidation')
  async sendEmailValidation(@Body() dto: SendEmailValidationDto): Promise<EmailValidationResponseDto> {
    return this.emailValidationService.sendEmailValidation(dto);
  }

  @Post('user/verifyEmailCode')
  async verifyEmailCode(@Body() dto: VerifyEmailCodeDto): Promise<EmailCodeVerificationResponseDto> {
    return this.emailValidationService.verifyEmailCode(dto);
  }

  @Post('user/sendPhoneValidation')
  async sendPhoneValidation(@Body() dto: SendPhoneValidationDto): Promise<PhoneValidationResponseDto> {
    return this.phoneValidationService.sendPhoneValidation(dto);
  }

  @Post('user/verifyPhoneCode')
  async verifyPhoneCode(@Body() dto: VerifyPhoneCodeDto): Promise<PhoneCodeVerificationResponseDto> {
    return this.phoneValidationService.verifyPhoneCode(dto);
  }

  @Post('user/forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    return this.passwordRecoveryService.forgotPassword(dto);
  }

  @Post('user/verify')
  async verify(@Body() dto: VerifyPasswordDto): Promise<VerifyPasswordResponseDto> {
    return this.passwordRecoveryService.verifyPassword(dto);
  }

  @Post('user/unlock')
  async unlock(@Body() dto: UnlockAccountDto, @Req() req: Request): Promise<UnlockAccountResponseDto> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.passwordRecoveryService.unlockAccount(dto, { ipAddress, userAgent });
  }
}

@Controller('api/security')
export class SecurityController {
  constructor(private tokenService: TokenService) {}

  @Post('token')
  async getToken(): Promise<TokenResponseDto> {
    return this.tokenService.getToken();
  }
}
