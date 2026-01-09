import { Controller, Post, Get, Body, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
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

@ApiTags('biometric')
@ApiBearerAuth('JWT-auth')
@Controller('api/auth')
@UseGuards(AuthGuard)
export class BiometricController {
  constructor(
    private deviceRegistrationService: DeviceRegistrationService,
    private challengeVerificationService: ChallengeVerificationService,
    private deviceManagementService: DeviceManagementService,
  ) {}

  @Post('challenge')
  @ApiOperation({
    summary: 'Generate biometric challenge',
    description: 'Generates a new challenge for biometric authentication',
  })
  @ApiResponse({
    status: 201,
    description: 'Desafio gerado com sucesso',
    type: GenerateChallengeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado',
  })
  async generateChallenge(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateChallengeDto,
  ): Promise<GenerateChallengeResponseDto> {
    return this.challengeVerificationService.generateChallenge(dto);
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Verify biometric signature',
    description: 'Verifies the biometric signature of the challenge',
  })
  @ApiResponse({
    status: 200,
    description: 'Signature verified successfully',
    type: VerifySignatureResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or malformed signature',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async verifySignature(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifySignatureDto,
  ): Promise<VerifySignatureResponseDto> {
    return this.challengeVerificationService.verifySignature(dto);
  }

  @Post('register-device')
  @ApiOperation({
    summary: 'Register device with biometrics',
    description: 'Registers a new device with biometric authentication enabled',
  })
  @ApiResponse({
    status: 201,
    description: 'Device registered successfully',
    type: RegisterDeviceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data for device registration',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async registerDevice(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceDto & { userId?: string },
  ): Promise<RegisterDeviceResponseDto> {
    return this.deviceRegistrationService.registerDevice(userId, dto);
  }

  @Post('register-device-soft')
  @ApiOperation({
    summary: 'Register device with soft authentication',
    description: 'Registers a device with soft biometric authentication (less secure)',
  })
  @ApiResponse({
    status: 201,
    description: 'Device registered successfully',
    type: RegisterDeviceSoftResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data for device registration',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async registerDeviceSoft(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceSoftDto & { userId?: string },
  ): Promise<RegisterDeviceSoftResponseDto> {
    return this.deviceRegistrationService.registerDeviceSoft(userId, dto);
  }

  @Post('device/send-sms-validation')
  @ApiOperation({
    summary: 'Send SMS validation to device',
    description: 'Sends an SMS validation code to the registered device',
  })
  @ApiResponse({
    status: 201,
    description: 'Validation SMS sent successfully',
    type: SendDeviceSmsValidationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or device not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async sendDeviceSmsValidation(
    @CurrentUser('id') userId: string,
    @Body() dto: SendDeviceSmsValidationDto & { userId?: string },
  ): Promise<SendDeviceSmsValidationResponseDto> {
    return this.deviceManagementService.sendDeviceSmsValidation(userId, dto);
  }

  @Post('device/verify-sms-and-activate')
  @ApiOperation({
    summary: 'Verify SMS and activate device',
    description: 'Verifies the SMS code and activates the device for authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'Device activated successfully',
    type: VerifySmsChallengeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired SMS code',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async verifySmsAndActivate(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifySmsChallengeDto & { userId?: string },
  ): Promise<VerifySmsChallengeResponseDto> {
    return this.challengeVerificationService.verifySmsAndActivate(userId, dto);
  }

  @Post('revoke-device')
  @ApiOperation({
    summary: 'Revoke device',
    description: 'Removes a device from the list of authenticated devices',
  })
  @ApiResponse({
    status: 200,
    description: 'Device revoked successfully',
    type: RevokeDeviceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Device not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async revokeDevice(
    @CurrentUser('id') userId: string,
    @Body() dto: RevokeDeviceDto & { userId?: string },
  ): Promise<RevokeDeviceResponseDto> {
    return this.deviceManagementService.revokeDevice(userId, dto);
  }

  @Get('devices/:userId')
  @ApiOperation({
    summary: 'List registered devices',
    description: 'Returns a list of registered biometric devices for the user',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'User identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Device list retrieved successfully',
    type: [ListDevicesResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - cannot access another user\'s data',
  })
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
  @ApiOperation({
    summary: 'Check device health',
    description: 'Checks the status and availability of a biometric device',
  })
  @ApiQuery({
    name: 'userId',
    type: String,
    required: false,
    description: 'User identifier',
  })
  @ApiQuery({
    name: 'deviceIdentifier',
    type: String,
    required: false,
    description: 'Device unique identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Device status retrieved successfully',
    type: CheckDeviceHealthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
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
