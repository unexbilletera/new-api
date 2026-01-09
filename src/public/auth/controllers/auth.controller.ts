import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
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

@ApiTags('Autenticação')
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
    summary: 'Registro de novo usuário',
    description: 'Cria uma nova conta de usuário no sistema com os dados fornecidos',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário registrado com sucesso',
    type: SignupResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou usuário já existe',
  })
  @ApiBody({ type: SignupDto })
  async signup(@Body() dto: SignupDto): Promise<SignupResponseDto | SignupDeviceRequiredResponseDto> {
    return this.signupService.signup(dto);
  }

  @Post('user/signin')
  @ApiOperation({
    summary: 'Login de usuário',
    description: 'Autentica um usuário existente e retorna os tokens de acesso',
  })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: SigninResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  @ApiBody({ type: SigninDto })
  async signin(@Body() dto: SigninDto, @Req() req: Request): Promise<SigninResponseDto | SigninDeviceRequiredResponseDto> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.signinService.signin(dto, { ipAddress, userAgent });
  }

  @Post('user/sendEmailValidation')
  @ApiOperation({
    summary: 'Enviar código de validação por e-mail',
    description: 'Envia um código de validação para o e-mail do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Código enviado com sucesso',
    type: EmailValidationResponseDto,
  })
  @ApiBody({ type: SendEmailValidationDto })
  async sendEmailValidation(@Body() dto: SendEmailValidationDto): Promise<EmailValidationResponseDto> {
    return this.emailValidationService.sendEmailValidation(dto);
  }

  @Post('user/verifyEmailCode')
  @ApiOperation({
    summary: 'Verificar código de e-mail',
    description: 'Valida o código de verificação enviado por e-mail',
  })
  @ApiResponse({
    status: 200,
    description: 'Código verificado com sucesso',
    type: EmailCodeVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Código inválido ou expirado',
  })
  @ApiBody({ type: VerifyEmailCodeDto })
  async verifyEmailCode(@Body() dto: VerifyEmailCodeDto): Promise<EmailCodeVerificationResponseDto> {
    return this.emailValidationService.verifyEmailCode(dto);
  }

  @Post('user/sendPhoneValidation')
  @ApiOperation({
    summary: 'Enviar código de validação por SMS',
    description: 'Envia um código de validação para o telefone do usuário via SMS',
  })
  @ApiResponse({
    status: 200,
    description: 'Código enviado com sucesso',
    type: PhoneValidationResponseDto,
  })
  @ApiBody({ type: SendPhoneValidationDto })
  async sendPhoneValidation(@Body() dto: SendPhoneValidationDto): Promise<PhoneValidationResponseDto> {
    return this.phoneValidationService.sendPhoneValidation(dto);
  }

  @Post('user/verifyPhoneCode')
  @ApiOperation({
    summary: 'Verificar código de telefone',
    description: 'Valida o código de verificação enviado por SMS',
  })
  @ApiResponse({
    status: 200,
    description: 'Código verificado com sucesso',
    type: PhoneCodeVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Código inválido ou expirado',
  })
  @ApiBody({ type: VerifyPhoneCodeDto })
  async verifyPhoneCode(@Body() dto: VerifyPhoneCodeDto): Promise<PhoneCodeVerificationResponseDto> {
    return this.phoneValidationService.verifyPhoneCode(dto);
  }

  @Post('user/forgot')
  @ApiOperation({
    summary: 'Recuperação de senha',
    description: 'Inicia o processo de recuperação de senha do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'E-mail de recuperação enviado com sucesso',
    type: ForgotPasswordResponseDto,
  })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    return this.passwordRecoveryService.forgotPassword(dto);
  }

  @Post('user/verify')
  @ApiOperation({
    summary: 'Verificar código de recuperação',
    description: 'Valida o código de recuperação de senha',
  })
  @ApiResponse({
    status: 200,
    description: 'Código verificado com sucesso',
    type: VerifyPasswordResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Código inválido ou expirado',
  })
  @ApiBody({ type: VerifyPasswordDto })
  async verify(@Body() dto: VerifyPasswordDto): Promise<VerifyPasswordResponseDto> {
    return this.passwordRecoveryService.verifyPassword(dto);
  }

  @Post('user/unlock')
  @ApiOperation({
    summary: 'Desbloquear conta',
    description: 'Desbloqueia a conta do usuário após verificação bem-sucedida',
  })
  @ApiResponse({
    status: 200,
    description: 'Conta desbloqueada com sucesso',
    type: UnlockAccountResponseDto,
  })
  @ApiBody({ type: UnlockAccountDto })
  async unlock(@Body() dto: UnlockAccountDto, @Req() req: Request): Promise<UnlockAccountResponseDto> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.passwordRecoveryService.unlockAccount(dto, { ipAddress, userAgent });
  }
}

@ApiTags('Segurança')
@Controller('api/security')
export class SecurityController {
  constructor(private tokenService: TokenService) {}

  @Post('token')
  @ApiOperation({
    summary: 'Obter token de segurança',
    description: 'Gera um novo token de segurança para operações públicas',
  })
  @ApiResponse({
    status: 200,
    description: 'Token gerado com sucesso',
    type: TokenResponseDto,
  })
  async getToken(): Promise<TokenResponseDto> {
    return this.tokenService.getToken();
  }
}
