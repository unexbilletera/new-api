import { Controller, Post, Patch, Get, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { SendEmailValidationDto } from '../../auth/dto/email-validation.dto';
import { SendPhoneValidationDto } from '../../auth/dto/phone-validation.dto';
import {
  StartUserOnboardingDto,
  VerifyOnboardingCodeDto,
  UpdateUserOnboardingDto,
  StartIdentityOnboardingDto,
  UpdateIdentityOnboardingDto,
  UploadArgentinaDocumentDto,
} from '../dto/onboarding.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { UserOnboardingService } from '../services/user-onboarding.service';
import { VerificationService } from '../services/verification.service';
import { IdentityOnboardingService } from '../services/identity-onboarding.service';
import { EmailValidationService } from '../../auth/services/email-validation.service';
import { PhoneValidationService } from '../../auth/services/phone-validation.service';
import {
  StartUserOnboardingResponseDto,
  VerifyOnboardingCodeResponseDto,
  UpdateUserOnboardingResponseDto,
  StartIdentityOnboardingResponseDto,
  UpdateIdentityOnboardingResponseDto,
  UploadArgentinaDocumentResponseDto,
  OnboardingPendingDataResponseDto,
  OnboardingStatusResponseDto,
  ValidateOnboardingDataResponseDto,
  RetryOnboardingResponseDto,
} from '../dto/response';

@ApiTags('1.3 Public - Onboarding')
@Controller('api/onboarding')
export class OnboardingController {
  constructor(
    private userOnboardingService: UserOnboardingService,
    private verificationService: VerificationService,
    private identityOnboardingService: IdentityOnboardingService,
    private emailValidationService: EmailValidationService,
    private phoneValidationService: PhoneValidationService,
  ) {}

  @Post('user/start')
  @ApiOperation({
    summary: 'Start user onboarding',
    description: 'Initiates the onboarding process by creating a new user',
  })
  @ApiResponse({
    status: 201,
    description: 'Onboarding started successfully',
    type: StartUserOnboardingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or email already registered',
  })
  async startUserOnboarding(@Body() dto: StartUserOnboardingDto): Promise<StartUserOnboardingResponseDto> {
    return this.userOnboardingService.startUserOnboarding(dto);
  }

  @Post('user/verify-code')
  @ApiOperation({
    summary: 'Verify onboarding code',
    description: 'Verifies the validation code sent during onboarding',
  })
  @ApiResponse({
    status: 200,
    description: 'Code verified successfully',
    type: VerifyOnboardingCodeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired code',
  })
  async verifyCode(@Body() dto: VerifyOnboardingCodeDto): Promise<VerifyOnboardingCodeResponseDto> {
    return this.verificationService.verifyOnboardingCode(dto);
  }

  @Post('user/send-email-validation')
  @ApiOperation({
    summary: 'Send email validation',
    description: 'Sends a validation code to the provided email',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation email sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email or already registered',
  })
  async sendEmailValidation(@Body() dto: SendEmailValidationDto) {
    return this.emailValidationService.sendEmailValidation(dto);
  }

  @Post('user/send-phone-validation')
  @ApiOperation({
    summary: 'Send phone validation',
    description: 'Sends a validation code via SMS to the provided phone number',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation SMS sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid phone number',
  })
  async sendPhoneValidation(@Body() dto: SendPhoneValidationDto) {
    return this.phoneValidationService.sendPhoneValidation(dto);
  }

  @Patch('user/:userId')
  @ApiOperation({
    summary: 'Update user data in onboarding',
    description: 'Updates user information during the onboarding process',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'User identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'User data updated successfully',
    type: UpdateUserOnboardingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateUserData(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserOnboardingDto,
  ): Promise<UpdateUserOnboardingResponseDto> {
    return this.userOnboardingService.updateUserOnboarding(userId, dto);
  }

  @Post('identity/:userId')
  @ApiOperation({
    summary: 'Start identity onboarding',
    description: 'Initiates the user identity validation process',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'User identifier',
  })
  @ApiResponse({
    status: 201,
    description: 'Identity onboarding started successfully',
    type: StartIdentityOnboardingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async startIdentityOnboarding(
    @Param('userId') userId: string,
    @Body() dto: StartIdentityOnboardingDto,
  ): Promise<StartIdentityOnboardingResponseDto> {
    return this.identityOnboardingService.startIdentityOnboarding(userId, dto);
  }

  @Patch('identity/:identityId')
  @ApiOperation({
    summary: 'Update identity information',
    description: 'Updates user identity data during validation',
  })
  @ApiParam({
    name: 'identityId',
    type: String,
    description: 'Identity document identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Identity updated successfully',
    type: UpdateIdentityOnboardingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
  })
  @ApiResponse({
    status: 404,
    description: 'Identity not found',
  })
  async updateIdentity(
    @Param('identityId') identityId: string,
    @Body() dto: UpdateIdentityOnboardingDto,
  ): Promise<UpdateIdentityOnboardingResponseDto> {
    return this.identityOnboardingService.updateIdentityOnboarding(identityId, dto);
  }

  @Post('identity/ar/upload-document')
  @ApiOperation({
    summary: 'Document upload - Argentina',
    description: 'Uploads the identity document for Argentina users',
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: UploadArgentinaDocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or incomplete data',
  })
  async uploadArgentinaDocument(
    @Body() dto: UploadArgentinaDocumentDto & { userId: string; identityId: string },
  ): Promise<UploadArgentinaDocumentResponseDto> {
    return this.identityOnboardingService.uploadArgentinaDocument(dto.userId, dto.identityId, dto);
  }
}

@ApiTags('1.3 Public - Onboarding')
@ApiBearerAuth('JWT-auth')
@Controller('api/users')
export class UserOnboardingController {
  constructor(private identityOnboardingService: IdentityOnboardingService) {}

  @Get('user/onboarding/pending-data/:userIdentityId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get pending onboarding data',
    description: 'Returns the data that still needs to be provided to complete onboarding',
  })
  @ApiParam({
    name: 'userIdentityId',
    type: String,
    description: 'User identity document identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending data retrieved successfully',
    type: OnboardingPendingDataResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: 404,
    description: 'Identity not found',
  })
  async getPendingData(
    @CurrentUser('id') userId: string,
    @Param('userIdentityId') userIdentityId: string,
  ): Promise<OnboardingPendingDataResponseDto> {
    return this.identityOnboardingService.getOnboardingPendingData(userIdentityId);
  }

  @Post('user/onboarding/update-specific-data/:userIdentityId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update specific onboarding data',
    description: 'Updates only the pending onboarding fields',
  })
  @ApiParam({
    name: 'userIdentityId',
    type: String,
    description: 'User identity document identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Data updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async updateSpecificData(
    @CurrentUser('id') userId: string,
    @Param('userIdentityId') userIdentityId: string,
    @Body() dto: any,
  ) {
    return this.identityOnboardingService.updateOnboardingSpecificData(userIdentityId, dto);
  }

  @Get('user/onboarding/status/:userIdentityId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get onboarding status',
    description: 'Returns the current status of the user\'s onboarding process',
  })
  @ApiParam({
    name: 'userIdentityId',
    type: String,
    description: 'User identity document identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding status retrieved successfully',
    type: OnboardingStatusResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: 404,
    description: 'Identity not found',
  })
  async getStatus(
    @CurrentUser('id') userId: string,
    @Param('userIdentityId') userIdentityId: string,
  ): Promise<OnboardingStatusResponseDto> {
    return this.identityOnboardingService.getOnboardingStatus(userIdentityId);
  }

  @Get('user/onboarding/validate/:userIdentityId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Validate onboarding data',
    description: 'Validates that all onboarding data was correctly provided',
  })
  @ApiParam({
    name: 'userIdentityId',
    type: String,
    description: 'User identity document identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation performed successfully',
    type: ValidateOnboardingDataResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Incomplete or invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async validate(
    @CurrentUser('id') userId: string,
    @Param('userIdentityId') userIdentityId: string,
  ): Promise<ValidateOnboardingDataResponseDto> {
    return this.identityOnboardingService.validateOnboardingData(userIdentityId);
  }

  @Post('user/onboarding/retry/:userIdentityId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry onboarding',
    description: 'Allows the user to retry the onboarding process after failure',
  })
  @ApiParam({
    name: 'userIdentityId',
    type: String,
    description: 'User identity document identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding restarted successfully',
    type: RetryOnboardingResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: 404,
    description: 'Identity not found',
  })
  async retry(
    @CurrentUser('id') userId: string,
    @Param('userIdentityId') userIdentityId: string,
  ): Promise<RetryOnboardingResponseDto> {
    return this.identityOnboardingService.retryOnboarding(userIdentityId);
  }
}
