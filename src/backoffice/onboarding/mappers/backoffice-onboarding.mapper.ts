import { Injectable } from '@nestjs/common';
import {
  OnboardingIdentityResponseDto,
  ListOnboardingResponseDto,
  OnboardingDetailsResponseDto,
  ApproveOnboardingResponseDto,
  RejectOnboardingResponseDto,
} from '../dto/response';

@Injectable()
export class BackofficeOnboardingMapper {
  toOnboardingIdentityResponseDto(
    identity: any,
  ): OnboardingIdentityResponseDto {
    return {
      id: identity.id,
      userId: identity.userId,
      country: identity.country,
      status: identity.status,
      type: identity.type,
      taxDocumentNumber: identity.taxDocumentNumber,
      identityDocumentNumber: identity.identityDocumentNumber,
      createdAt: identity.createdAt,
      updatedAt: identity.updatedAt,
    };
  }

  toOnboardingDetailsResponseDto(identity: any): OnboardingDetailsResponseDto {
    const dto = this.toOnboardingIdentityResponseDto(identity);
    return {
      ...dto,
      verifiedAt: identity.verifiedAt,
      rejectionReason: identity.rejectionReason,
      notes: identity.notes,
    };
  }

  toListOnboardingResponseDto(
    identities: any[],
    total: number,
    page: number,
    limit: number,
  ): ListOnboardingResponseDto {
    return {
      data: identities.map((i) => this.toOnboardingIdentityResponseDto(i)),
      total,
      page,
      limit,
    };
  }

  toApproveOnboardingResponseDto(
    identityId: string,
  ): ApproveOnboardingResponseDto {
    return {
      message: 'Onboarding approved successfully',
      identityId,
      status: 'approved',
      verifiedAt: new Date(),
    };
  }

  toRejectOnboardingResponseDto(
    identityId: string,
    reason: string,
  ): RejectOnboardingResponseDto {
    return {
      message: 'Onboarding rejected successfully',
      identityId,
      status: 'rejected',
      reason,
    };
  }
}
