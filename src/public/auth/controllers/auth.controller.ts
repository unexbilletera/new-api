import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, getSchemaPath } from '@nestjs/swagger';
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

@ApiTags('1. Public - Authentication')
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
  @ApiOperation({
    summary: 'Register new user',
    description: 'Creates a new user account in the system with the provided data',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(SignupResponseDto) },
        { $ref: getSchemaPath(SignupDeviceRequiredResponseDto) },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or user already exists',
  })
  @ApiBody({ type: SignupDto })
  async signup(@Body() dto: SignupDto): Promise<SignupResponseDto | SignupDeviceRequiredResponseDto> {
    return this.signupService.signup(dto);
  }

  @Post('user/signin')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates an existing user and returns access tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(SigninResponseDto) },
        { $ref: getSchemaPath(SigninDeviceRequiredResponseDto) },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @ApiBody({ type: SigninDto })
  async signin(@Body() dto: SigninDto, @Req() req: Request): Promise<SigninResponseDto | SigninDeviceRequiredResponseDto> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.signinService.signin(dto, { ipAddress, userAgent });
  }

  @Post('user/sendEmailValidation')
  @ApiOperation({
    summary: 'Send validation code via email',
    description: 'Sends a validation code to the user\'s email',
  })
  @ApiResponse({
    status: 200,
    description: 'Code sent successfully',
    type: EmailValidationResponseDto,
  })
  @ApiBody({ type: SendEmailValidationDto })
  async sendEmailValidation(@Body() dto: SendEmailValidationDto): Promise<EmailValidationResponseDto> {
    return this.emailValidationService.sendEmailValidation(dto);
  }

  @Post('user/verifyEmailCode')
  @ApiOperation({
    summary: 'Verify email code',
    description: 'Validates the verification code sent via email',
  })
  @ApiResponse({
    status: 200,
    description: 'Code verified successfully',
    type: EmailCodeVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired code',
  })
  @ApiBody({ type: VerifyEmailCodeDto })
  async verifyEmailCode(@Body() dto: VerifyEmailCodeDto): Promise<EmailCodeVerificationResponseDto> {
    return this.emailValidationService.verifyEmailCode(dto);
  }

  @Post('user/sendPhoneValidation')
  @ApiOperation({
    summary: 'Send validation code via SMS',
    description: 'Sends a validation code to the user\'s phone via SMS',
  })
  @ApiResponse({
    status: 200,
    description: 'Code sent successfully',
    type: PhoneValidationResponseDto,
  })
  @ApiBody({ type: SendPhoneValidationDto })
  async sendPhoneValidation(@Body() dto: SendPhoneValidationDto): Promise<PhoneValidationResponseDto> {
    return this.phoneValidationService.sendPhoneValidation(dto);
  }

  @Post('user/verifyPhoneCode')
  @ApiOperation({
    summary: 'Verify phone code',
    description: 'Validates the verification code sent via SMS',
  })
  @ApiResponse({
    status: 200,
    description: 'Code verified successfully',
    type: PhoneCodeVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired code',
  })
  @ApiBody({ type: VerifyPhoneCodeDto })
  async verifyPhoneCode(@Body() dto: VerifyPhoneCodeDto): Promise<PhoneCodeVerificationResponseDto> {
    return this.phoneValidationService.verifyPhoneCode(dto);
  }

  @Post('user/forgot')
  @ApiOperation({
    summary: 'Password recovery',
    description: 'Initiates the user password recovery process',
  })
  @ApiResponse({
    status: 200,
    description: 'Recovery email sent successfully',
    type: ForgotPasswordResponseDto,
  })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    return this.passwordRecoveryService.forgotPassword(dto);
  }

  @Post('user/verify')
  @ApiOperation({
    summary: 'Verify recovery code',
    description: 'Validates the password recovery code',
  })
  @ApiResponse({
    status: 200,
    description: 'Code verified successfully',
    type: VerifyPasswordResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired code',
  })
  @ApiBody({ type: VerifyPasswordDto })
  async verify(@Body() dto: VerifyPasswordDto): Promise<VerifyPasswordResponseDto> {
    return this.passwordRecoveryService.verifyPassword(dto);
  }

  @Post('user/unlock')
  @ApiOperation({
    summary: 'Unlock account',
    description: 'Unlocks the user account after successful verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Account unlocked successfully',
    type: UnlockAccountResponseDto,
  })
  @ApiBody({ type: UnlockAccountDto })
  async unlock(@Body() dto: UnlockAccountDto, @Req() req: Request): Promise<UnlockAccountResponseDto> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.passwordRecoveryService.unlockAccount(dto, { ipAddress, userAgent });
  }
}

@ApiTags('1. Public - Security')
@Controller('api/security')
export class SecurityController {
  constructor(private tokenService: TokenService) {}

  @Post('token')
  @ApiOperation({
    summary: 'Get security token',
    description: 'Generates a new security token for public operations',
  })
  @ApiResponse({
    status: 200,
    description: 'Token generated successfully',
    type: TokenResponseDto,
  })
  async getToken(): Promise<TokenResponseDto> {
    return this.tokenService.getToken();
  }
}
