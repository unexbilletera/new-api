import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
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
import {
  UserProfileResponseDto,
  EmailChangeRequestResponseDto,
  EmailChangeConfirmResponseDto,
  AddressUpdateResponseDto,
  ProfileUpdateResponseDto,
  PasswordChangeResponseDto,
  SignoutResponseDto,
  AccountClosureResponseDto,
  LivenessCheckResponseDto,
  OnboardingResponseDto,
  MessagingResponseDto,
  IdentityListResponseDto,
  AccountListResponseDto,
  AccountBalanceResponseDto,
} from '../dto/response';
import { UserProfileService } from '../services/user-profile.service';
import { EmailChangeService } from '../services/email-change.service';
import { PasswordService } from '../services/password.service';
import { SessionService } from '../services/session.service';
import { AccountClosureService } from '../services/account-closure.service';
import { LivenessService } from '../services/liveness.service';
import { IdentityService } from '../services/identity.service';
import { AccountService } from '../services/account.service';
import { OnboardingStatusService } from '../services/onboarding-status.service';
import { MessagingService } from '../services/messaging.service';
import { FastifyRequest } from 'fastify';

interface AuthenticatedUser {
  id: string;
  email?: string;
  roleId?: string;
}

@Controller('api/users')
export class UserController {
  constructor(
    private userProfileService: UserProfileService,
    private emailChangeService: EmailChangeService,
    private passwordService: PasswordService,
    private sessionService: SessionService,
    private accountClosureService: AccountClosureService,
    private livenessService: LivenessService,
    private identityService: IdentityService,
    private accountService: AccountService,
    private onboardingStatusService: OnboardingStatusService,
    private messagingService: MessagingService,
  ) {}

  @Get('user/me')
  @UseGuards(AuthGuard)
  async getCurrentUser(
    @CurrentUser() user: AuthenticatedUser,
    @Query('systemVersion') systemVersion?: string,
  ): Promise<UserProfileResponseDto> {
    return this.userProfileService.getCurrentUser(user.id, systemVersion);
  }

  @Post('user/change-email/request')
  @UseGuards(AuthGuard)
  async requestEmailChange(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestEmailChangeDto,
  ): Promise<EmailChangeRequestResponseDto> {
    return this.emailChangeService.requestEmailChange(user.id, dto);
  }

  @Post('user/change-email/confirm')
  @UseGuards(AuthGuard)
  async confirmEmailChange(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConfirmEmailChangeDto,
  ): Promise<EmailChangeConfirmResponseDto> {
    return this.emailChangeService.confirmEmailChange(user.id, dto);
  }

  @Post('user/address')
  @UseGuards(AuthGuard)
  async updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAddressDto,
  ): Promise<AddressUpdateResponseDto> {
    return this.userProfileService.updateAddress(user.id, dto);
  }

  @Post('user/profile')
  @UseGuards(AuthGuard)
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<ProfileUpdateResponseDto> {
    return this.userProfileService.updateProfile(user.id, dto);
  }

  @Post('user/change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Request() req: FastifyRequest,
  ): Promise<PasswordChangeResponseDto> {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket?.remoteAddress ||
      'unknown';
    const userAgent = (req.headers['user-agent'] as string) || undefined;

    return this.passwordService.changePassword(user.id, dto, { ipAddress, userAgent });
  }

  @Post('user/signout')
  @UseGuards(AuthGuard)
  async signout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto?: SignoutDto,
  ): Promise<SignoutResponseDto> {
    return this.sessionService.signout(user.id, dto?.deviceId);
  }

  @Post('user/closeAccount')
  @UseGuards(AuthGuard)
  async closeAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CloseAccountDto,
  ): Promise<AccountClosureResponseDto> {
    return this.accountClosureService.closeAccount(user.id, dto);
  }

  @Post('user/liveness')
  @UseGuards(AuthGuard)
  async livenessCheck(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LivenessCheckDto,
  ): Promise<LivenessCheckResponseDto> {
    return this.livenessService.livenessCheck(user.id, dto);
  }

  @Post('user/onboarding/:step')
  @UseGuards(AuthGuard)
  async onboardingWithStep(
    @CurrentUser() user: AuthenticatedUser,
    @Param('step') step: string,
  ): Promise<OnboardingResponseDto> {
    return this.onboardingStatusService.onboarding(user.id, step);
  }

  @Post('user/onboarding')
  @UseGuards(AuthGuard)
  async onboarding(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OnboardingResponseDto> {
    return this.onboardingStatusService.onboarding(user.id, undefined);
  }

  @Post('sendMessage')
  @UseGuards(AuthGuard)
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ): Promise<MessagingResponseDto> {
    return this.messagingService.sendMessage(user.id, dto);
  }

  @Get('user/identities/:userId')
  @UseGuards(AuthGuard)
  async getUserIdentities(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ): Promise<IdentityListResponseDto> {
    if (user.id !== userId) {
      throw new ForbiddenException('users.errors.forbidden');
    }
    return this.identityService.getUserIdentities(userId);
  }

  @Post('user/setDefaultUserIdentity/:id')
  @UseGuards(AuthGuard)
  async setDefaultIdentity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') identityId: string,
  ) {
    return this.identityService.setDefaultIdentity(user.id, { identityId });
  }

  @Post('user/setDefaultUserAccount/:id')
  @UseGuards(AuthGuard)
  async setDefaultAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') accountId: string,
  ) {
    return this.accountService.setDefaultAccount(user.id, { accountId });
  }

  @Post('user/setUserAccountAlias/:id')
  @UseGuards(AuthGuard)
  async setUserAccountAlias(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') accountId: string,
    @Body() dto: SetUserAccountAliasDto,
  ) {
    return this.accountService.setUserAccountAlias(user.id, accountId, dto.alias);
  }

  @Get('user/balances')
  @UseGuards(AuthGuard)
  async getAccountBalances(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AccountBalanceResponseDto> {
    return this.accountService.getAccountBalances(user.id);
  }

  @Get('userAccountInfo/:id')
  async getUserAccountInfo(@Param('id') accountId: string) {
    return this.accountService.getUserAccountInfo(accountId);
  }

  @Get('sailpointInfo/:id')
  async getSailpointInfo(@Param('id') sailpointId: string) {
    return { message: 'Sailpoint info retrieved' };
  }
}
