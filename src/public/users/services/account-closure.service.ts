import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserModel } from '../models/user.model';
import { PasswordHelper } from '../../../shared/helpers/password.helper';
import { CloseAccountDto } from '../dto/user-profile.dto';
import { AccountClosureResponseDto } from '../dto/response';

@Injectable()
export class AccountClosureService {
  constructor(private userModel: UserModel) {}

  async closeAccount(userId: string, dto: CloseAccountDto): Promise<AccountClosureResponseDto> {
    const user = await this.userModel.findByIdWithValidStatus(userId);

    if (!user) {
      throw new NotFoundException('users.errors.invalidContextUser');
    }

    const isPasswordValid = await PasswordHelper.compare(dto.password, user.password || '');
    if (!isPasswordValid) {
      throw new BadRequestException('users.errors.invalidPassword');
    }

    await this.userModel.closeAccount(userId);

    return { accessToken: null };
  }
}
