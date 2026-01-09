import { Controller, Post, Patch, Get, Body, Param, UseGuards } from '@nestjs/common';
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
import { AuthGuard } from '../../../shared/guards/auth.guard';
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
  async startUserOnboarding(@Body() dto: StartUserOnboardingDto): Promise<StartUserOnboardingResponseDto> {
    return this.userOnboardingService.startUserOnboarding(dto);
  }

  @Post('user/verify-code')
  async verifyCode(@Body() dto: VerifyOnboardingCodeDto): Promise<VerifyOnboardingCodeResponseDto> {
    return this.verificationService.verifyOnboardingCode(dto);
  }

  @Post('user/send-email-validation')
  async sendEmailValidation(@Body() dto: SendEmailValidationDto) {
    return this.emailValidationService.sendEmailValidation(dto);
  }

  @Post('user/send-phone-validation')
  async sendPhoneValidation(@Body() dto: SendPhoneValidationDto) {
    return this.phoneValidationService.sendPhoneValidation(dto);
  }

  @Patch('user/:userId')
  async updateUserData(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserOnboardingDto,
  ): Promise<UpdateUserOnboardingResponseDto> {
    return this.userOnboardingService.updateUserOnboarding(userId, dto);
  }

  @Post('identity/:userId')
  async startIdentityOnboarding(
    @Param('userId') userId: string,
    @Body() dto: StartIdentityOnboardingDto,
  ): Promise<StartIdentityOnboardingResponseDto> {
    return this.identityOnboardingService.startIdentityOnboarding(userId, dto);
  }

  @Patch('identity/:identityId')
  async updateIdentity(
    @Param('identityId') identityId: string,
    @Body() dto: UpdateIdentityOnboardingDto,
  ): Promise<UpdateIdentityOnboardingResponseDto> {
    return this.identityOnboardingService.updateIdentityOnboarding(identityId, dto);
  }

  @Post('identity/ar/upload-document')
  async uploadArgentinaDocument(
    @Body() dto: UploadArgentinaDocumentDto & { userId: string; identityId: string },
  ): Promise<UploadArgentinaDocumentResponseDto> {
    return this.identityOnboardingService.uploadArgentinaDocument(dto.userId, dto.identityId, dto);
  }
}

@Controller('api/users')
export class UserOnboardingController {
  constructor(private identityOnboardingService: IdentityOnboardingService) {}

  @Get('user/onboarding/pending-data/:userIdentityId')
  @UseGuards(AuthGuard)
  async getPendingData(
    @CurrentUser('id') userId: string,
    @Param('userIdentityId') userIdentityId: string,
  ): Promise<OnboardingPendingDataResponseDto> {
    return this.identityOnboardingService.getOnboardingPendingData(userIdentityId);
  }

  @Post('user/onboarding/update-specific-data/:userIdentityId')
  @UseGuards(AuthGuard)
  async updateSpecificData(
    @CurrentUser('id') userId: string,
    @Param('userIdentityId') userIdentityId: string,
    @Body() dto: any,
  ) {
    return this.identityOnboardingService.updateOnboardingSpecificData(userIdentityId, dto);
  }

  @Get('user/onboarding/status/:userIdentityId')
  @UseGuards(AuthGuard)
  async getStatus(
    @CurrentUser('id') userId: string,
    @Param('userIdentityId') userIdentityId: string,
  ): Promise<OnboardingStatusResponseDto> {
    return this.identityOnboardingService.getOnboardingStatus(userIdentityId);
  }

  @Get('user/onboarding/validate/:userIdentityId')
  @UseGuards(AuthGuard)
  async validate(
    @CurrentUser('id') userId: string,
    @Param('userIdentityId') userIdentityId: string,
  ): Promise<ValidateOnboardingDataResponseDto> {
    return this.identityOnboardingService.validateOnboardingData(userIdentityId);
  }

  @Post('user/onboarding/retry/:userIdentityId')
  @UseGuards(AuthGuard)
  async retry(
    @CurrentUser('id') userId: string,
    @Param('userIdentityId') userIdentityId: string,
  ): Promise<RetryOnboardingResponseDto> {
    return this.identityOnboardingService.retryOnboarding(userIdentityId);
  }
}
