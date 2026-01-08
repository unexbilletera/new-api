import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '../../../shared/jwt/jwt.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PasswordHelper } from '../../../shared/helpers/password.helper';
import { ErrorCodes, ErrorHelper, SuccessCodes } from '../../../shared/errors/app-error';

/**
 * Controller TEMPORÁRIO para testes de autenticação
 * 
 * Este controller permite fazer login com validação real de credenciais
 * para obter um token JWT e testar os endpoints protegidos.
 * 
 * ⚠️ REMOVER EM PRODUÇÃO ⚠️
 */
@Controller('test/auth')
export class TestAuthController {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  /**
   * Login temporário para testes (com validação de senha)
   * POST /test/auth/login
   * 
   * Body:
   * {
   *   "email": "email@exemplo.com" (obrigatório)
   *   "password": "senha-do-usuario" (obrigatório)
   * }
   * 
   * Retorna:
   * {
   *   "token": "jwt-token-aqui",
   *   "user": { ... }
   * }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async testLogin(
    @Body() body: { email: string; password: string },
  ): Promise<{
    token?: string;
    user?: any;
    message?: string;
    code?: string;
    error?: string;
  }> {
    try {
      // Validação de campos obrigatórios
      if (!body?.email) {
        throw ErrorHelper.badRequest(ErrorCodes.USERS_INVALID_EMAIL);
      }

      if (!body?.password) {
        throw ErrorHelper.badRequest(ErrorCodes.USERS_INVALID_PASSWORD);
      }

      // Busca usuário por email
      const user = await this.prisma.users.findFirst({
        where: {
          email: body.email,
          deletedAt: null,
        },
        include: {
          usersIdentities_usersIdentities_userIdTousers: {
            where: { status: 'enable' },
            take: 1,
          },
        },
      });

      if (!user) {
        throw ErrorHelper.unauthorized(ErrorCodes.USERS_INVALID_CREDENTIALS);
      }

      // Verifica se usuário tem senha cadastrada
      if (!user.password) {
        throw ErrorHelper.unauthorized(ErrorCodes.USERS_INVALID_CREDENTIALS);
      }

      // Valida senha
      const isPasswordValid = await PasswordHelper.compare(
        body.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw ErrorHelper.unauthorized(ErrorCodes.USERS_INVALID_CREDENTIALS);
      }

      // Atualiza último login
      await this.prisma.users.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Gera token JWT
      const token = await this.jwtService.generateToken({
        userId: user.id,
        email: user.email || '',
        roleId: 'customer', // Valor padrão para usuários do app
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status,
          identity: user.usersIdentities_usersIdentities_userIdTousers[0] || null,
        },
        message: SuccessCodes.USERS_LOGIN_SUCCESS,
        code: SuccessCodes.USERS_LOGIN_SUCCESS,
      };
    } catch (error) {
      // Se já for um AppError, re-lançar
      if (error && typeof error === 'object' && 'getStatus' in error) {
        throw error;
      }
      throw ErrorHelper.unauthorized(ErrorCodes.USERS_INVALID_CREDENTIALS);
    }
  }

  /**
   * Login temporário para backoffice (com validação de senha)
   * POST /test/auth/backoffice-login
   * 
   * Body:
   * {
   *   "email": "email@exemplo.com" (obrigatório)
   *   "password": "senha-do-usuario" (obrigatório)
   * }
   * 
   * Retorna:
   * {
   *   "token": "jwt-token-aqui",
   *   "user": { ... }
   * }
   */
  @Post('backoffice-login')
  @HttpCode(HttpStatus.OK)
  async testBackofficeLogin(
    @Body() body: { email: string; password: string },
  ): Promise<{
    token?: string;
    user?: any;
    message?: string;
    code?: string;
    error?: string;
  }> {
    try {
      // Validação de campos obrigatórios
      if (!body?.email) {
        throw ErrorHelper.badRequest(ErrorCodes.BACKOFFICE_INVALID_EMAIL);
      }

      if (!body?.password) {
        throw ErrorHelper.badRequest(ErrorCodes.BACKOFFICE_INVALID_PASSWORD);
      }

      // Busca usuário por email
      const user = await this.prisma.backofficeUsers.findFirst({
        where: {
          email: body.email,
          deletedAt: null,
        },
        include: {
          backofficeRoles: true,
        },
      });

      if (!user) {
        throw ErrorHelper.unauthorized(ErrorCodes.BACKOFFICE_INVALID_CREDENTIALS);
      }

      // Verifica se usuário está ativo
      if (user.status !== 'active') {
        throw ErrorHelper.unauthorized(ErrorCodes.BACKOFFICE_USER_INACTIVE);
      }

      // Valida senha
      const isPasswordValid = await PasswordHelper.compare(
        body.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw ErrorHelper.unauthorized(ErrorCodes.BACKOFFICE_INVALID_CREDENTIALS);
      }

      // Atualiza último login
      await this.prisma.backofficeUsers.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Gera token JWT
      const token = await this.jwtService.generateToken({
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status,
          role: user.backofficeRoles,
        },
        message: SuccessCodes.BACKOFFICE_LOGIN_SUCCESS,
        code: SuccessCodes.BACKOFFICE_LOGIN_SUCCESS,
      };
    } catch (error) {
      // Se já for um AppError, re-lançar
      if (error && typeof error === 'object' && 'getStatus' in error) {
        throw error;
      }
      throw ErrorHelper.unauthorized(ErrorCodes.BACKOFFICE_INVALID_CREDENTIALS);
    }
  }
}
