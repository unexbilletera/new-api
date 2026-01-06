import { Controller, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { SignupDto } from '../dto/signup.dto';
import { SigninDto } from '../dto/signin.dto';
import { SendEmailValidationDto, VerifyEmailCodeDto } from '../dto/email-validation.dto';
import { SendPhoneValidationDto, VerifyPhoneCodeDto } from '../dto/phone-validation.dto';
import { ForgotPasswordDto, VerifyPasswordDto, UnlockAccountDto } from '../dto/password-recovery.dto';
@Controller('api/users')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('user/signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }
  @Post('user/signin')
  async signin(@Body() dto: SigninDto, @Req() req: Request) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.signin(dto, { ipAddress, userAgent });
  }
  @Post('user/sendEmailValidation')
  async sendEmailValidation(@Body() dto: SendEmailValidationDto) {
    return this.authService.sendEmailValidation(dto);
  }
  @Post('user/verifyEmailCode')
  async verifyEmailCode(@Body() dto: VerifyEmailCodeDto) {
    return this.authService.verifyEmailCode(dto);
  }
  @Post('user/sendPhoneValidation')
  async sendPhoneValidation(@Body() dto: SendPhoneValidationDto) {
    return this.authService.sendPhoneValidation(dto);
  }
  @Post('user/verifyPhoneCode')
  async verifyPhoneCode(@Body() dto: VerifyPhoneCodeDto) {
    return this.authService.verifyPhoneCode(dto);
  }
  @Post('user/forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }
  @Post('user/verify')
  async verify(@Body() dto: VerifyPasswordDto) {
    return this.authService.verifyPassword(dto);
  }
  @Post('user/unlock')
  async unlock(@Body() dto: UnlockAccountDto, @Req() req: Request) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.unlockAccount(dto, { ipAddress, userAgent });
  }
}
@Controller('api/security')
export class SecurityController {
  constructor(private authService: AuthService) {}
  @Post('token')
  async getToken() {
    return this.authService.getToken();
  }
}
