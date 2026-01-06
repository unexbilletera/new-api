import { Controller, Post, Get, Body, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { BiometricService } from '../services/biometric.service';
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

@Controller('api/auth')
@UseGuards(AuthGuard)
export class BiometricController {
  constructor(private biometricService: BiometricService) {}

  @Post('challenge')
  async generateChallenge(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateChallengeDto,
  ) {
    return this.biometricService.generateChallenge(dto);
  }

  @Post('verify')
  async verifySignature(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifySignatureDto,
  ) {
    return this.biometricService.verifySignature(dto);
  }

  @Post('register-device')
  async registerDevice(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceDto & { userId?: string },
  ) {
    return this.biometricService.registerDevice(userId, dto);
  }

  @Post('register-device-soft')
  async registerDeviceSoft(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceSoftDto & { userId?: string },
  ) {
    return this.biometricService.registerDeviceSoft(userId, dto);
  }

  @Post('device/send-sms-validation')
  async sendDeviceSmsValidation(
    @CurrentUser('id') userId: string,
    @Body() dto: SendDeviceSmsValidationDto & { userId?: string },
  ) {
    return this.biometricService.sendDeviceSmsValidation(userId, dto);
  }

  @Post('device/verify-sms-and-activate')
  async verifySmsAndActivate(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifySmsChallengeDto & { userId?: string },
  ) {
    return this.biometricService.verifySmsAndActivate(userId, dto);
  }

  @Post('revoke-device')
  async revokeDevice(
    @CurrentUser('id') userId: string,
    @Body() dto: RevokeDeviceDto & { userId?: string },
  ) {
    return this.biometricService.revokeDevice(userId, dto);
  }

  @Get('devices/:userId')
  async listDevices(
    @CurrentUser('id') authUserId: string,
    @Param('userId') userId: string,
  ) {
    if (userId && userId !== authUserId) {
      throw new ForbiddenException('users.errors.forbidden');
    }
    return this.biometricService.listUserDevices(authUserId);
  }

  @Get('device/health-check')
  async healthCheck(
    @CurrentUser('id') authUserId: string,
    @Query('userId') userId: string,
    @Query('deviceIdentifier') deviceIdentifier: string,
  ) {
    if (userId && userId !== authUserId) {
      throw new ForbiddenException('users.errors.forbidden');
    }
    return this.biometricService.checkDeviceHealth(authUserId, deviceIdentifier);
  }
}
