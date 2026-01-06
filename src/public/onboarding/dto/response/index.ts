export class StartUserOnboardingResponseDto {
  success: boolean;
  message: string;
  userId: string;
  onboardingState: {
    completedSteps: string[];
    needsCorrection: string[];
  };
  nextStep: string;
}

export class VerifyOnboardingCodeResponseDto {
  success: boolean;
  message: string;
  userId: string;
  onboardingState: {
    completedSteps: string[];
    needsCorrection: string[];
  };
  nextStep: string | null;
}

export class UpdateUserOnboardingResponseDto {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  onboardingState: {
    completedSteps: string[];
    needsCorrection: string[];
  };
}

export class StartIdentityOnboardingResponseDto {
  message: string;
  identityId: string;
}

export class UpdateIdentityOnboardingResponseDto {
  message: string;
  identityId: string;
}

export class UploadArgentinaDocumentResponseDto {
  message: string;
  onboardingState: {
    completedSteps: string[];
    needsCorrection: string[];
  };
}

export class OnboardingPendingDataResponseDto {
  pendingFields: string[];
  needsCorrection: string[];
}

export class OnboardingStatusResponseDto {
  status: 'completed' | 'pending';
  completionPercentage: number;
  pendingSteps: string[];
}

export class ValidateOnboardingDataResponseDto {
  isValid: boolean;
  errors: string[];
}

export class RetryOnboardingResponseDto {
  message: string;
}
