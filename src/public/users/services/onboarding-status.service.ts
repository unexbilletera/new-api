import { Injectable, NotFoundException } from '@nestjs/common';
import { UserModel } from '../models/user.model';
import { OnboardingResponseDto } from '../dto/response';

@Injectable()
export class OnboardingStatusService {
  constructor(private userModel: UserModel) {}

  async onboarding(userId: string, step?: string): Promise<OnboardingResponseDto> {
    const user = await this.userModel.findByIdWithAll(userId);

    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    return {
      message: 'Onboarding data processed',
      onboardingState: user.onboardingState,
      nextStep: 'identity_verification',
    };
  }
}
