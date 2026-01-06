import { Controller, Post, Get, Body, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import {
  GenerateChallengeDto,
  VerifySignatureDto,
  RegisterDeviceDto,
  RegisterDeviceSoftDto,
  SendDeviceSmsValidationDto,
  VerifySmsChallengeDto,
  RevokeDeviceDto,
} from '../dto/biometric.dto';
import { AuthGuard } from '../../../shared/guards/auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { DeviceRegistrationService } from '../services/device-registration.service';
import { ChallengeVerificationService } from '../services/challenge-verification.service';
import { DeviceManagementService } from '../services/device-management.service';
import {
  GenerateChallengeResponseDto,
  VerifySignatureResponseDto,
  RegisterDeviceResponseDto,
  RegisterDeviceSoftResponseDto,
  SendDeviceSmsValidationResponseDto,
  VerifySmsChallengeResponseDto,
  RevokeDeviceResponseDto,
  ListDevicesResponseDto,
  CheckDeviceHealthResponseDto,
} from '../dto/response';

@Controller('api/auth')
@UseGuards(AuthGuard)
export class BiometricController {
  constructor(
    private deviceRegistrationService: DeviceRegistrationService,
    private challengeVerificationService: ChallengeVerificationService,
    private deviceManagementService: DeviceManagementService,
  ) {}

  @Post('challenge')
  async generateChallenge(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateChallengeDto,
  ): Promise<GenerateChallengeResponseDto> {
    return this.challengeVerificationService.generateChallenge(dto);
  }

  @Post('verify')
  async verifySignature(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifySignatureDto,
  ): Promise<VerifySignatureResponseDto> {
    return this.challengeVerificationService.verifySignature(dto);
  }

  @Post('register-device')
  async registerDevice(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceDto & { userId?: string },
  ): Promise<RegisterDeviceResponseDto> {
    return this.deviceRegistrationService.registerDevice(userId, dto);
  }

  @Post('register-device-soft')
  async registerDeviceSoft(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceSoftDto & { userId?: string },
  ): Promise<RegisterDeviceSoftResponseDto> {
    return this.deviceRegistrationService.registerDeviceSoft(userId, dto);
  }

  @Post('device/send-sms-validation')
  async sendDeviceSmsValidation(
    @CurrentUser('id') userId: string,
    @Body() dto: SendDeviceSmsValidationDto & { userId?: string },
  ): Promise<SendDeviceSmsValidationResponseDto> {
    return this.deviceManagementService.sendDeviceSmsValidation(userId, dto);
  }

  @Post('device/verify-sms-and-activate')
  async verifySmsAndActivate(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifySmsChallengeDto & { userId?: string },
  ): Promise<VerifySmsChallengeResponseDto> {
    return this.challengeVerificationService.verifySmsAndActivate(userId, dto);
  }

  @Post('revoke-device')
  async revokeDevice(
    @CurrentUser('id') userId: string,
    @Body() dto: RevokeDeviceDto & { userId?: string },
  ): Promise<RevokeDeviceResponseDto> {
    return this.deviceManagementService.revokeDevice(userId, dto);
  }

  @Get('devices/:userId')
  async listDevices(
    @CurrentUser('id') authUserId: string,
    @Param('userId') userId: string,
  ): Promise<ListDevicesResponseDto[]> {
    if (userId && userId !== authUserId) {
      throw new ForbiddenException('users.errors.forbidden');
    }
    return this.deviceManagementService.listUserDevices(authUserId);
  }

  @Get('device/health-check')
  async healthCheck(
    @CurrentUser('id') authUserId: string,
    @Query('userId') userId: string,
    @Query('deviceIdentifier') deviceIdentifier: string,
  ): Promise<CheckDeviceHealthResponseDto> {
    if (userId && userId !== authUserId) {
      throw new ForbiddenException('users.errors.forbidden');
    }
    return this.deviceManagementService.checkDeviceHealth(authUserId, deviceIdentifier);
  }
}
