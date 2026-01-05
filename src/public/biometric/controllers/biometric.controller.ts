import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
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

@Controller('api/auth')
export class BiometricController {
  constructor(private biometricService: BiometricService) {}

  @Post('challenge')
  async generateChallenge(@Body() dto: GenerateChallengeDto) {
    return this.biometricService.generateChallenge(dto);
  }

  @Post('verify')
  async verifySignature(@Body() dto: VerifySignatureDto) {
    return this.biometricService.verifySignature(dto);
  }

  @Post('register-device')
  async registerDevice(@Body() dto: RegisterDeviceDto & { userId: string }) {
    return this.biometricService.registerDevice(dto.userId, dto);
  }

  @Post('register-device-soft')
  async registerDeviceSoft(@Body() dto: RegisterDeviceSoftDto & { userId: string }) {
    return this.biometricService.registerDeviceSoft(dto.userId, dto);
  }

  @Post('device/send-sms-validation')
  async sendDeviceSmsValidation(@Body() dto: SendDeviceSmsValidationDto & { userId: string }) {
    return this.biometricService.sendDeviceSmsValidation(dto.userId, dto);
  }

  @Post('device/verify-sms-and-activate')
  async verifySmsAndActivate(@Body() dto: VerifySmsChallengeDto & { userId: string }) {
    return this.biometricService.verifySmsAndActivate(dto.userId, dto);
  }

  @Post('revoke-device')
  async revokeDevice(@Body() dto: RevokeDeviceDto & { userId: string }) {
    return this.biometricService.revokeDevice(dto.userId, dto);
  }

  @Get('devices/:userId')
  async listDevices(@Param('userId') userId: string) {
    return this.biometricService.listUserDevices(userId);
  }

  @Get('device/health-check')
  async healthCheck(
    @Query('userId') userId: string,
    @Query('deviceIdentifier') deviceIdentifier: string,
  ) {
    return this.biometricService.checkDeviceHealth(userId, deviceIdentifier);
  }
}
