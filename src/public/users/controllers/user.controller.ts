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

@ApiTags('Usuários')
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
    summary: 'Obter dados do usuário atual',
    description: 'Retorna as informações completas do perfil do usuário autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados do usuário retornados com sucesso',
    type: UserProfileResponseDto,
  })
  @ApiQuery({
    name: 'systemVersion',
    required: false,
    description: 'Versão do sistema do cliente',
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
    summary: 'Solicitar alteração de e-mail',
    description: 'Inicia o processo de alteração do e-mail do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitação de alteração enviada com sucesso',
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
    summary: 'Confirmar alteração de e-mail',
    description: 'Confirma a alteração do e-mail com o código enviado',
  })
  @ApiResponse({
    status: 200,
    description: 'E-mail alterado com sucesso',
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
    summary: 'Atualizar endereço',
    description: 'Atualiza o endereço cadastrado do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Endereço atualizado com sucesso',
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
    summary: 'Atualizar perfil',
    description: 'Atualiza as informações do perfil do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
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
    summary: 'Alterar senha',
    description: 'Altera a senha do usuário autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso',
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
    summary: 'Fazer logout',
    description: 'Encerra a sessão do usuário autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
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
    summary: 'Encerrar conta',
    description: 'Inicia o processo de encerramento da conta do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitação de encerramento processada com sucesso',
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
    summary: 'Verificação de vivacidade',
    description: 'Realiza verificação de vivacidade do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Verificação concluída com sucesso',
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
    summary: 'Avançar onboarding por etapa',
    description: 'Avança o processo de onboarding para uma etapa específica',
  })
  @ApiResponse({
    status: 200,
    description: 'Etapa de onboarding processada com sucesso',
    type: OnboardingResponseDto,
  })
  @ApiParam({
    name: 'step',
    description: 'Identificador da etapa do onboarding',
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
    summary: 'Atualizar status de onboarding',
    description: 'Atualiza o status geral do onboarding do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Status de onboarding atualizado com sucesso',
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
    summary: 'Enviar mensagem',
    description: 'Envia uma mensagem do usuário através do sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensagem enviada com sucesso',
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
    summary: 'Listar identidades do usuário',
    description: 'Retorna todas as identidades cadastradas do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de identidades retornada com sucesso',
    type: IdentityListResponseDto,
  })
  @ApiParam({
    name: 'userId',
    description: 'ID do usuário',
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
    summary: 'Definir identidade padrão',
    description: 'Define uma identidade como padrão para o usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Identidade padrão definida com sucesso',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da identidade',
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
    summary: 'Definir conta padrão',
    description: 'Define uma conta como padrão para o usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Conta padrão definida com sucesso',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da conta',
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
    summary: 'Definir apelido da conta',
    description: 'Define um apelido personalizado para a conta do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Apelido definido com sucesso',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da conta',
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
    summary: 'Obter saldos das contas',
    description: 'Retorna os saldos de todas as contas do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Saldos retornados com sucesso',
    type: AccountBalanceResponseDto,
  })
  async getAccountBalances(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AccountBalanceResponseDto> {
    return this.accountService.getAccountBalances(user.id);
  }

  @Get('userAccountInfo/:id')
  @ApiOperation({
    summary: 'Obter informações da conta',
    description: 'Retorna informações detalhadas de uma conta específica',
  })
  @ApiResponse({
    status: 200,
    description: 'Informações da conta retornadas com sucesso',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da conta',
  })
  async getUserAccountInfo(@Param('id') accountId: string) {
    return this.accountService.getUserAccountInfo(accountId);
  }

  @Get('sailpointInfo/:id')
  @ApiOperation({
    summary: 'Obter informações do Sailpoint',
    description: 'Retorna informações do Sailpoint para um ID específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Informações do Sailpoint retornadas com sucesso',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do Sailpoint',
  })
  async getSailpointInfo(@Param('id') sailpointId: string) {
    return { message: 'Sailpoint info retrieved' };
  }
}
