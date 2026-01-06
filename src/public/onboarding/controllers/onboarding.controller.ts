import { Controller, Post, Patch, Get, Body, Param, UseGuards } from '@nestjs/common';
import { OnboardingService } from '../services/onboarding.service';
import { AuthService } from '../../auth/services/auth.service';
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
@Controller('api/onboarding')
export class OnboardingController {
  constructor(
    private onboardingService: OnboardingService,
    private authService: AuthService,
  ) {}
  @Post('user/start')
  async startUserOnboarding(@Body() dto: StartUserOnboardingDto) {
    return this.onboardingService.startUserOnboarding(dto);
  }
  @Post('user/verify-code')
  async verifyCode(@Body() dto: VerifyOnboardingCodeDto) {
    return this.onboardingService.verifyOnboardingCode(dto);
  }
  @Post('user/send-email-validation')
  async sendEmailValidation(@Body() dto: SendEmailValidationDto) {
    return this.authService.sendEmailValidation(dto);
  }
  @Post('user/send-phone-validation')
  async sendPhoneValidation(@Body() dto: SendPhoneValidationDto) {
    return this.authService.sendPhoneValidation(dto);
  }
  @Patch('user/:userId')
  async updateUserData(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserOnboardingDto,
  ) {
    return this.onboardingService.updateUserOnboarding(userId, dto);
  }
  @Post('identity/:userId')
  async startIdentityOnboarding(
    @Param('userId') userId: string,
    @Body() dto: StartIdentityOnboardingDto,
  ) {
    return this.onboardingService.startIdentityOnboarding(userId, dto);
  }
  @Patch('identity/:identityId')
  async updateIdentity(
    @Param('identityId') identityId: string,
    @Body() dto: UpdateIdentityOnboardingDto,
  ) {
    return this.onboardingService.updateIdentityOnboarding(identityId, dto);
  }
  @Post('identity/ar/upload-document')
  async uploadArgentinaDocument(
    @Body() dto: UploadArgentinaDocumentDto & { userId: string; identityId: string },
  ) {
    return this.onboardingService.uploadArgentinaDocument(dto.userId, dto.identityId, dto);
  }
}
@Controller('api/users')
export class UserOnboardingController {
  constructor(private onboardingService: OnboardingService) {}
  @Get('user/onboarding/pending-data/:userIdentityId')
  @UseGuards(AuthGuard)
  async getPendingData(
    @CurrentUser('id') userId: string,
    @Param('userIdentityId') userIdentityId: string,
  ) {
    return this.onboardingService.getOnboardingPendingData(userIdentityId);
  }
  @Post('user/onboarding/update-specific-data/:userIdentityId')
  @UseGuards(AuthGuard)
  async updateSpecificData(
    @CurrentUser('id') userId: string,
    @Param('userIdentityId') userIdentityId: string,
    @Body() dto: any,
  ) {
    return this.onboardingService.updateOnboardingSpecificData(userIdentityId, dto);
  }
  @Get('user/onboarding/status/:userIdentityId')
  @UseGuards(AuthGuard)
  async getStatus(
    @CurrentUser('id') userId: string,
    @Param('userIdentityId') userIdentityId: string,
  ) {
    return this.onboardingService.getOnboardingStatus(userIdentityId);
  }
  @Get('user/onboarding/validate/:userIdentityId')
  @UseGuards(AuthGuard)
  async validate(
    @CurrentUser('id') userId: string,
    @Param('userIdentityId') userIdentityId: string,
  ) {
    return this.onboardingService.validateOnboardingData(userIdentityId);
  }
  @Post('user/onboarding/retry/:userIdentityId')
  @UseGuards(AuthGuard)
  async retry(
    @CurrentUser('id') userId: string,
    @Param('userIdentityId') userIdentityId: string,
  ) {
    return this.onboardingService.retryOnboarding(userIdentityId);
  }
}
