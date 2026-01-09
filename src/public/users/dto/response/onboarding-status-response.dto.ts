import { ApiProperty } from '@nestjs/swagger';

export class OnboardingResponseDto {
  @ApiProperty({
    description: 'Message about the onboarding status',
    example: 'Onboarding in progress - Awaiting document verification',
  })
  message: string;

  @ApiProperty({
    description: "User's current onboarding state",
    example: {
      step: 'IDENTITY_VERIFICATION',
      status: 'PENDING',
      completedSteps: ['PERSONAL_DATA', 'EMAIL_VALIDATION'],
    },
  })
  onboardingState: any;

  @ApiProperty({
    description: 'Next required step in the onboarding process',
    example: 'DOCUMENT_UPLOAD',
  })
  nextStep: string;
}
