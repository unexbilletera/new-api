import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtService } from '../../../shared/jwt/jwt.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PasswordHelper } from '../../../shared/helpers/password.helper';
import {
  ErrorCodes,
  ErrorHelper,
  SuccessCodes,
} from '../../../shared/errors/app-error';

@Controller('test/auth')
export class TestAuthController {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async testLogin(@Body() body: { email: string; password: string }): Promise<{
    token?: string;
    user?: any;
    message?: string;
    code?: string;
    error?: string;
  }> {
    try {
      if (!body?.email) {
        throw ErrorHelper.badRequest(ErrorCodes.USERS_INVALID_EMAIL);
      }

      if (!body?.password) {
        throw ErrorHelper.badRequest(ErrorCodes.USERS_INVALID_PASSWORD);
      }

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

      if (!user.password) {
        throw ErrorHelper.unauthorized(ErrorCodes.USERS_INVALID_CREDENTIALS);
      }

      const isPasswordValid = await PasswordHelper.compare(
        body.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw ErrorHelper.unauthorized(ErrorCodes.USERS_INVALID_CREDENTIALS);
      }

      await this.prisma.users.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const token = await this.jwtService.generateToken({
        userId: user.id,
        email: user.email || '',
        roleId: 'customer',
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status,
          identity:
            user.usersIdentities_usersIdentities_userIdTousers[0] || null,
        },
        message: SuccessCodes.USERS_LOGIN_SUCCESS,
        code: SuccessCodes.USERS_LOGIN_SUCCESS,
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'getStatus' in error) {
        throw error;
      }
      throw ErrorHelper.unauthorized(ErrorCodes.USERS_INVALID_CREDENTIALS);
    }
  }

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
      if (!body?.email) {
        throw ErrorHelper.badRequest(ErrorCodes.BACKOFFICE_INVALID_EMAIL);
      }

      if (!body?.password) {
        throw ErrorHelper.badRequest(ErrorCodes.BACKOFFICE_INVALID_PASSWORD);
      }

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
        throw ErrorHelper.unauthorized(
          ErrorCodes.BACKOFFICE_INVALID_CREDENTIALS,
        );
      }

      if (user.status !== 'active') {
        throw ErrorHelper.unauthorized(ErrorCodes.BACKOFFICE_USER_INACTIVE);
      }

      const isPasswordValid = await PasswordHelper.compare(
        body.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw ErrorHelper.unauthorized(
          ErrorCodes.BACKOFFICE_INVALID_CREDENTIALS,
        );
      }

      await this.prisma.backofficeUsers.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

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
      if (error && typeof error === 'object' && 'getStatus' in error) {
        throw error;
      }
      throw ErrorHelper.unauthorized(ErrorCodes.BACKOFFICE_INVALID_CREDENTIALS);
    }
  }
}
