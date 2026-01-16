import { Injectable } from '@nestjs/common';
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

@Injectable()
export class OnboardingMapper {
  toStartUserOnboardingResponseDto(
    userId: string,
    onboardingState: any,
  ): StartUserOnboardingResponseDto {
    return {
      success: true,
      message: 'Onboarding started successfully',
      userId,
      onboardingState,
      nextStep: 'emailForm',
    };
  }

  toVerifyOnboardingCodeResponseDto(
    userId: string,
    onboardingState: any,
    nextStep: string | null,
  ): VerifyOnboardingCodeResponseDto {
    return {
      success: true,
      message: 'Code verified successfully',
      userId,
      onboardingState,
      nextStep,
    };
  }

  toUpdateUserOnboardingResponseDto(
    user: any,
    onboardingState: any,
  ): UpdateUserOnboardingResponseDto {
    return {
      success: true,
      message: 'Data updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      onboardingState,
    };
  }

  toStartIdentityOnboardingResponseDto(
    identityId: string,
  ): StartIdentityOnboardingResponseDto {
    return {
      message: 'Identity onboarding started',
      identityId,
    };
  }

  toUpdateIdentityOnboardingResponseDto(
    identityId: string,
  ): UpdateIdentityOnboardingResponseDto {
    return {
      message: 'Identity updated successfully',
      identityId,
    };
  }

  toUploadArgentinaDocumentResponseDto(
    onboardingState: any,
  ): UploadArgentinaDocumentResponseDto {
    return {
      message: 'Document uploaded successfully',
      onboardingState,
    };
  }

  toOnboardingPendingDataResponseDto(
    pendingSteps: string[],
    needsCorrection: string[],
  ): OnboardingPendingDataResponseDto {
    return {
      pendingFields: pendingSteps,
      needsCorrection,
    };
  }

  toOnboardingStatusResponseDto(
    requiredSteps: string[],
    completedSteps: string[],
  ): OnboardingStatusResponseDto {
    const pendingSteps = requiredSteps.filter(
      (step) => !completedSteps.includes(step),
    );
    const completionPercentage = Math.round(
      ((requiredSteps.length - pendingSteps.length) / requiredSteps.length) *
        100,
    );

    return {
      status: pendingSteps.length === 0 ? 'completed' : 'pending',
      completionPercentage,
      pendingSteps,
    };
  }

  toValidateOnboardingDataResponseDto(
    errors: string[],
  ): ValidateOnboardingDataResponseDto {
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toRetryOnboardingResponseDto(): RetryOnboardingResponseDto {
    return {
      message: 'Onboarding data resubmitted',
    };
  }
}
