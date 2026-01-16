import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PasswordHelper } from '../../../shared/helpers/password.helper';
import { Injectable } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { JwtService } from '../../../shared/jwt/jwt.service';
import {
  ErrorCodes,
  ErrorHelper,
  SuccessCodes,
} from '../../../shared/errors/app-error';

@Injectable()
export class BackofficeUserModel {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
  async findByEmail(email: string) {
    return this.prisma.backofficeUsers.findFirst({
      where: { email },
      include: {
        backofficeRoles: true,
      },
    });
  }
  async validateCredentials(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.findByEmail(loginDto.email);

    if (!user) {
      throw ErrorHelper.unauthorized(ErrorCodes.BACKOFFICE_INVALID_CREDENTIALS);
    }

    if (user.status !== 'active') {
      throw ErrorHelper.unauthorized(ErrorCodes.BACKOFFICE_USER_INACTIVE);
    }

    const isPasswordValid = await PasswordHelper.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw ErrorHelper.unauthorized(ErrorCodes.BACKOFFICE_INVALID_CREDENTIALS);
    }
    await this.prisma.backofficeUsers.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    const accessToken = await this.jwtService.generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: {
          id: user.backofficeRoles.id,
          name: user.backofficeRoles.name,
          level: user.backofficeRoles.level,
        },
      },
      message: SuccessCodes.BACKOFFICE_LOGIN_SUCCESS,
      code: SuccessCodes.BACKOFFICE_LOGIN_SUCCESS,
    };
  }
  async findById(id: string) {
    const user = await this.prisma.backofficeUsers.findFirst({
      where: { id },
      include: {
        backofficeRoles: true,
      },
    });

    if (!user) {
      throw ErrorHelper.notFound(ErrorCodes.BACKOFFICE_USER_NOT_FOUND);
    }

    return user;
  }
}
