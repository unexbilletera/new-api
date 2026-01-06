import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { AuthGuard } from '../../../shared/guards/auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import {
  UpdateUserProfileDto,
  SignoutDto,
  CloseAccountDto,
  LivenessCheckDto,
  SendMessageDto,
  SetDefaultIdentityDto,
  SetDefaultAccountDto,
  SetUserAccountAliasDto,
  ChangePasswordDto,
  RequestEmailChangeDto,
  ConfirmEmailChangeDto,
  UpdateAddressDto,
} from '../dto/user-profile.dto';
import { FastifyRequest } from 'fastify';

interface AuthenticatedUser {
  id: string;
  email?: string;
  roleId?: string;
}

@Controller('api/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('user/me')
  @UseGuards(AuthGuard)
  async getCurrentUser(
    @CurrentUser() user: AuthenticatedUser,
    @Query('systemVersion') systemVersion?: string,
  ) {
    return this.userService.getCurrentUser(user.id, systemVersion);
  }

  @Post('user/change-email/request')
  @UseGuards(AuthGuard)
  async requestEmailChange(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestEmailChangeDto,
  ) {
    return this.userService.requestEmailChange(user.id, dto);
  }

  @Post('user/change-email/confirm')
  @UseGuards(AuthGuard)
  async confirmEmailChange(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConfirmEmailChangeDto,
  ) {
    return this.userService.confirmEmailChange(user.id, dto);
  }

  @Post('user/address')
  @UseGuards(AuthGuard)
  async updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.userService.updateAddress(user.id, dto);
  }

  @Post('user/profile')
  @UseGuards(AuthGuard)
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.userService.updateProfile(user.id, dto);
  }

  @Post('user/change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Request() req: FastifyRequest,
  ) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket?.remoteAddress ||
      'unknown';
    const userAgent = (req.headers['user-agent'] as string) || undefined;

    return this.userService.changePassword(user.id, dto, { ipAddress, userAgent });
  }
  @Post('user/signout')
  @UseGuards(AuthGuard)
  async signout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto?: SignoutDto,
  ) {
    return this.userService.signout(user.id, dto?.deviceId);
  }

  @Post('user/closeAccount')
  @UseGuards(AuthGuard)
  async closeAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CloseAccountDto,
  ) {
    return this.userService.closeAccount(user.id, dto);
  }

  @Post('user/liveness')
  @UseGuards(AuthGuard)
  async livenessCheck(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LivenessCheckDto,
  ) {
    return this.userService.livenessCheck(user.id, dto);
  }
  @Post('user/onboarding/:step?')
  @UseGuards(AuthGuard)
  async onboarding(
    @CurrentUser() user: AuthenticatedUser,
    @Param('step') step?: string,
  ) {
    return this.userService.onboarding(user.id, step);
  }

  @Post('sendMessage')
  @UseGuards(AuthGuard)
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.userService.sendMessage(user.id, dto);
  }

  @Get('user/identities/:userId')
  @UseGuards(AuthGuard)
  async getUserIdentities(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ) {
    if (user.id !== userId) {
      const { ForbiddenException } = await import('@nestjs/common');
      throw new ForbiddenException('users.errors.forbidden');
    }
    return this.userService.getUserIdentities(userId);
  }

  @Post('user/setDefaultUserIdentity/:id')
  @UseGuards(AuthGuard)
  async setDefaultIdentity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') identityId: string,
  ) {
    return this.userService.setDefaultIdentity(user.id, { identityId });
  }

  @Post('user/setDefaultUserAccount/:id')
  @UseGuards(AuthGuard)
  async setDefaultAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') accountId: string,
  ) {
    return this.userService.setDefaultAccount(user.id, { accountId });
  }

  @Post('user/setUserAccountAlias/:id')
  @UseGuards(AuthGuard)
  async setUserAccountAlias(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') accountId: string,
    @Body() dto: SetUserAccountAliasDto,
  ) {
    return this.userService.setUserAccountAlias(user.id, accountId, dto.alias);
  }

  @Get('user/balances')
  @UseGuards(AuthGuard)
  async getAccountBalances(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.userService.getAccountBalances(user.id);
  }
  @Get('userAccountInfo/:id')
  async getUserAccountInfo(@Param('id') accountId: string) {
    return this.userService.getUserAccountInfo(accountId);
  }
  @Get('sailpointInfo/:id')
  async getSailpointInfo(@Param('id') sailpointId: string) {
    return this.userService.getSailpointInfo(sailpointId);
  }
}
