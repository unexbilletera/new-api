import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { UserService } from '../services/user.service';
import {
  UpdateUserProfileDto,
  SignoutDto,
  CloseAccountDto,
  LivenessCheckDto,
  SendMessageDto,
  SetDefaultIdentityDto,
  SetDefaultAccountDto,
  SetUserAccountAliasDto,
} from '../dto/user-profile.dto';
@Controller('api/users')
export class UserController {
  constructor(private userService: UserService) {}
  @Get('user/me')
  async getCurrentUser(@Query('systemVersion') systemVersion?: string) {
    return this.userService.getCurrentUser('userId', systemVersion);
  }
  @Post('user/profile')
  async updateProfile(
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.userService.updateProfile('userId', dto);
  }
  @Post('user/signout')
  async signout(@Body() dto?: SignoutDto) {
    return this.userService.signout('userId', dto?.deviceId);
  }
  @Post('user/closeAccount')
  async closeAccount(
    @Body() dto: CloseAccountDto,
  ) {
    return this.userService.closeAccount('userId', dto);
  }
  @Post('user/liveness')
  async livenessCheck(
    @Body() dto: LivenessCheckDto,
  ) {
    return this.userService.livenessCheck('userId', dto);
  }
  @Post('user/onboarding/:step?')
  async onboarding(
    @Param('step') step?: string,
  ) {
    return this.userService.onboarding('userId', step);
  }
  @Post('sendMessage')
  async sendMessage(
    @Body() dto: SendMessageDto,
  ) {
    return this.userService.sendMessage('userId', dto);
  }
  @Get('user/identities/:userId')
  async getUserIdentities(@Param('userId') userId: string) {
    return this.userService.getUserIdentities(userId);
  }
  @Post('user/setDefaultUserIdentity/:id')
  async setDefaultIdentity(
    @Param('id') identityId: string,
  ) {
    return this.userService.setDefaultIdentity('userId', { identityId });
  }
  @Post('user/setDefaultUserAccount/:id')
  async setDefaultAccount(
    @Param('id') accountId: string,
  ) {
    return this.userService.setDefaultAccount('userId', { accountId });
  }
  @Post('user/setUserAccountAlias/:id')
  async setUserAccountAlias(
    @Param('id') accountId: string,
    @Body() dto: SetUserAccountAliasDto,
  ) {
    return this.userService.setUserAccountAlias('userId', accountId, dto.alias);
  }
  @Get('user/balances')
  async getAccountBalances(
  ) {
    return this.userService.getAccountBalances('userId');
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
