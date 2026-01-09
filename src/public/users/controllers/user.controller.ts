import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
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

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({
    summary: 'Get current user data',
    description: 'Returns complete information about the authenticated user\'s profile',
  })
  @ApiResponse({
    status: 200,
    description: 'User data returned successfully',
    type: UserProfileResponseDto,
  })
  @ApiQuery({
    name: 'systemVersion',
    required: false,
    description: 'Client system version',
  })
  async getCurrentUser(
    @CurrentUser() user: AuthenticatedUser,
    @Query('systemVersion') systemVersion?: string,
  ): Promise<UserProfileResponseDto> {
    return this.userProfileService.getCurrentUser(user.id, systemVersion);
  }

  @Post('user/change-email/request')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Request email change',
    description: 'Initiates the user email change process',
  })
  @ApiResponse({
    status: 200,
    description: 'Change request sent successfully',
    type: EmailChangeRequestResponseDto,
  })
  @ApiBody({ type: RequestEmailChangeDto })
  async requestEmailChange(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestEmailChangeDto,
  ): Promise<EmailChangeRequestResponseDto> {
    return this.emailChangeService.requestEmailChange(user.id, dto);
  }

  @Post('user/change-email/confirm')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Confirm email change',
    description: 'Confirms the email change with the sent code',
  })
  @ApiResponse({
    status: 200,
    description: 'Email changed successfully',
    type: EmailChangeConfirmResponseDto,
  })
  @ApiBody({ type: ConfirmEmailChangeDto })
  async confirmEmailChange(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConfirmEmailChangeDto,
  ): Promise<EmailChangeConfirmResponseDto> {
    return this.emailChangeService.confirmEmailChange(user.id, dto);
  }

  @Post('user/address')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update address',
    description: 'Updates the user\'s registered address',
  })
  @ApiResponse({
    status: 200,
    description: 'Address updated successfully',
    type: AddressUpdateResponseDto,
  })
  @ApiBody({ type: UpdateAddressDto })
  async updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAddressDto,
  ): Promise<AddressUpdateResponseDto> {
    return this.userProfileService.updateAddress(user.id, dto);
  }

  @Post('user/profile')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update profile',
    description: 'Updates the user\'s profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: ProfileUpdateResponseDto,
  })
  @ApiBody({ type: UpdateUserProfileDto })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<ProfileUpdateResponseDto> {
    return this.userProfileService.updateProfile(user.id, dto);
  }

  @Post('user/change-password')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Change password',
    description: 'Changes the authenticated user\'s password',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: PasswordChangeResponseDto,
  })
  @ApiBody({ type: ChangePasswordDto })
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
  @ApiOperation({
    summary: 'Logout',
    description: 'Ends the authenticated user\'s session',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    type: SignoutResponseDto,
  })
  @ApiBody({ type: SignoutDto, required: false })
  async signout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto?: SignoutDto,
  ): Promise<SignoutResponseDto> {
    return this.sessionService.signout(user.id, dto?.deviceId);
  }

  @Post('user/closeAccount')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Close account',
    description: 'Initiates the user account closure process',
  })
  @ApiResponse({
    status: 200,
    description: 'Closure request processed successfully',
    type: AccountClosureResponseDto,
  })
  @ApiBody({ type: CloseAccountDto })
  async closeAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CloseAccountDto,
  ): Promise<AccountClosureResponseDto> {
    return this.accountClosureService.closeAccount(user.id, dto);
  }

  @Post('user/liveness')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Liveness verification',
    description: 'Performs user liveness verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification completed successfully',
    type: LivenessCheckResponseDto,
  })
  @ApiBody({ type: LivenessCheckDto })
  async livenessCheck(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LivenessCheckDto,
  ): Promise<LivenessCheckResponseDto> {
    return this.livenessService.livenessCheck(user.id, dto);
  }

  @Post('user/onboarding/:step')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Advance onboarding by step',
    description: 'Advances the onboarding process to a specific step',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding step processed successfully',
    type: OnboardingResponseDto,
  })
  @ApiParam({
    name: 'step',
    description: 'Onboarding step identifier',
  })
  async onboardingWithStep(
    @CurrentUser() user: AuthenticatedUser,
    @Param('step') step: string,
  ): Promise<OnboardingResponseDto> {
    return this.onboardingStatusService.onboarding(user.id, step);
  }

  @Post('user/onboarding')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update onboarding status',
    description: 'Updates the user\'s overall onboarding status',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding status updated successfully',
    type: OnboardingResponseDto,
  })
  async onboarding(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OnboardingResponseDto> {
    return this.onboardingStatusService.onboarding(user.id, undefined);
  }

  @Post('sendMessage')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Send message',
    description: 'Sends a user message through the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Message sent successfully',
    type: MessagingResponseDto,
  })
  @ApiBody({ type: SendMessageDto })
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ): Promise<MessagingResponseDto> {
    return this.messagingService.sendMessage(user.id, dto);
  }

  @Get('user/identities/:userId')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List user identities',
    description: 'Returns all registered identities of the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Identity list returned successfully',
    type: IdentityListResponseDto,
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
  })
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
  @ApiOperation({
    summary: 'Set default identity',
    description: 'Sets an identity as default for the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Default identity set successfully',
  })
  @ApiParam({
    name: 'id',
    description: 'Identity ID',
  })
  async setDefaultIdentity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') identityId: string,
  ) {
    return this.identityService.setDefaultIdentity(user.id, { identityId });
  }

  @Post('user/setDefaultUserAccount/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Set default account',
    description: 'Sets an account as default for the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Default account set successfully',
  })
  @ApiParam({
    name: 'id',
    description: 'Account ID',
  })
  async setDefaultAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') accountId: string,
  ) {
    return this.accountService.setDefaultAccount(user.id, { accountId });
  }

  @Post('user/setUserAccountAlias/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Set account alias',
    description: 'Sets a custom alias for the user account',
  })
  @ApiResponse({
    status: 200,
    description: 'Alias set successfully',
  })
  @ApiParam({
    name: 'id',
    description: 'Account ID',
  })
  @ApiBody({ type: SetUserAccountAliasDto })
  async setUserAccountAlias(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') accountId: string,
    @Body() dto: SetUserAccountAliasDto,
  ) {
    return this.accountService.setUserAccountAlias(user.id, accountId, dto.alias);
  }

  @Get('user/balances')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get account balances',
    description: 'Returns the balances of all user accounts',
  })
  @ApiResponse({
    status: 200,
    description: 'Balances returned successfully',
    type: AccountBalanceResponseDto,
  })
  async getAccountBalances(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AccountBalanceResponseDto> {
    return this.accountService.getAccountBalances(user.id);
  }

  @Get('userAccountInfo/:id')
  @ApiOperation({
    summary: 'Get account information',
    description: 'Returns detailed information about a specific account',
  })
  @ApiResponse({
    status: 200,
    description: 'Account information returned successfully',
  })
  @ApiParam({
    name: 'id',
    description: 'Account ID',
  })
  async getUserAccountInfo(@Param('id') accountId: string) {
    return this.accountService.getUserAccountInfo(accountId);
  }

  @Get('sailpointInfo/:id')
  @ApiOperation({
    summary: 'Get Sailpoint information',
    description: 'Returns Sailpoint information for a specific ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Sailpoint information returned successfully',
  })
  @ApiParam({
    name: 'id',
    description: 'Sailpoint ID',
  })
  async getSailpointInfo(@Param('id') sailpointId: string) {
    return { message: 'Sailpoint info retrieved' };
  }
}
