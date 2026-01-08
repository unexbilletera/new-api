export class OnboardingIdentityResponseDto {
  id: string;
  userId: string;
  country: string;
  status: string;
  type?: string;
  taxDocumentNumber?: string;
  identityDocumentNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ListOnboardingResponseDto {
  data: OnboardingIdentityResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class OnboardingDetailsResponseDto extends OnboardingIdentityResponseDto {
  verifiedAt?: Date;
  rejectionReason?: string;
  notes?: string;
}

export class ApproveOnboardingResponseDto {
  message: string;
  identityId: string;
  status: string;
  verifiedAt: Date;
}

export class RejectOnboardingResponseDto {
  message: string;
  identityId: string;
  status: string;
  reason: string;
}
