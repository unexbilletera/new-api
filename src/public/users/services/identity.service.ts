import { Injectable } from '@nestjs/common';
import { UserModel } from '../models/user.model';
import { IdentityModel } from '../models/identity.model';
import { SetDefaultIdentityDto } from '../dto/user-profile.dto';
import { IdentityListResponseDto } from '../dto/response';

@Injectable()
export class IdentityService {
  constructor(
    private userModel: UserModel,
    private identityModel: IdentityModel,
  ) {}

  async getUserIdentities(userId: string): Promise<IdentityListResponseDto> {
    const identities = await this.userModel.getUserIdentities(userId);

    return {
      identities: identities.map((i: any) => ({
        id: i.id,
        country: i.country,
        taxDocumentNumber: i.taxDocumentNumber,
        taxDocumentType: i.taxDocumentType,
        identityDocumentNumber: i.identityDocumentNumber,
        identityDocumentType: i.identityDocumentType,
        status: i.status,
        createdAt: i.createdAt,
      })),
    };
  }

  async setDefaultIdentity(userId: string, dto: SetDefaultIdentityDto) {
    await this.userModel.setDefaultIdentity(userId, dto.identityId);

    return { message: 'Default identity set' };
  }
}
