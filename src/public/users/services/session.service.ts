import { Injectable } from '@nestjs/common';
import { UserModel } from '../models/user.model';
import { SignoutResponseDto } from '../dto/response';

@Injectable()
export class SessionService {
  constructor(private userModel: UserModel) {}

  async signout(
    userId: string,
    deviceId?: string,
  ): Promise<SignoutResponseDto> {
    const user = await this.userModel.findByIdWithValidStatus(userId);

    if (user) {
      await this.userModel.clearTokens(user.id);
    }

    return { accessToken: null };
  }
}
