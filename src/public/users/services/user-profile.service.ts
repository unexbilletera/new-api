import { Injectable } from '@nestjs/common';
import { UserModel } from '../models/user.model';
import { IdentityModel } from '../models/identity.model';
import { ExchangeRatesService } from '../../../shared/exchange/exchange-rates.service';
import { SystemVersionService } from '../../../shared/helpers/system-version.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { UserMapper } from '../mappers/user.mapper';
import { UpdateUserProfileDto, UpdateAddressDto } from '../dto/user-profile.dto';
import { UserProfileResponseDto, ProfileUpdateResponseDto, AddressUpdateResponseDto } from '../dto/response';

@Injectable()
export class UserProfileService {
  constructor(
    private userModel: UserModel,
    private identityModel: IdentityModel,
    private exchangeRatesService: ExchangeRatesService,
    private systemVersionService: SystemVersionService,
    private logger: LoggerService,
    private userMapper: UserMapper,
  ) {}

  async getCurrentUser(userId: string, systemVersion?: string): Promise<UserProfileResponseDto> {
    this.logger.info('[PROFILE] Getting current user', { userId });

    const user = await this.userModel.findById(userId);

    let forceUpgrade = false;
    if (systemVersion) {
      const versionResult = this.systemVersionService.validateVersion(systemVersion);
      forceUpgrade = !versionResult.isValid;
    }

    let exchangeRates: any = null;
    try {
      exchangeRates = await this.exchangeRatesService.getRates();
      this.logger.debug('[PROFILE] Exchange rates obtained successfully');
    } catch (mantecaError: any) {
      this.logger.warn('[PROFILE] Manteca getRates failed (non-critical)', { error: mantecaError.message });
      exchangeRates = null;
    }

    this.logger.info('[PROFILE] Current user retrieved successfully', { userId });
    return this.userMapper.toProfileResponseDto(user, { exchangeRates, forceUpgrade });
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto): Promise<ProfileUpdateResponseDto> {
    this.logger.info('[PROFILE] Updating user profile', { userId, fields: Object.keys(dto) });

    const user = await this.userModel.findByIdWithValidStatus(userId);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (dto.firstName) {
      const formattedFirstName = this.formatName(dto.firstName);
      if (!formattedFirstName || formattedFirstName.trim().length < 2) {
        throw new Error('users.errors.invalidFirstName');
      }
      updateData.firstName = formattedFirstName;
    }

    if (dto.lastName) {
      const formattedLastName = this.formatName(dto.lastName);
      if (!formattedLastName || formattedLastName.trim().length < 2) {
        throw new Error('users.errors.invalidLastName');
      }
      updateData.lastName = formattedLastName;
    }

    if (dto.firstName && dto.lastName) {
      updateData.name = `${dto.firstName} ${dto.lastName}`;
    } else if (dto.firstName && user.lastName) {
      updateData.name = `${dto.firstName} ${user.lastName}`;
    } else if (dto.lastName && user.firstName) {
      updateData.name = `${user.firstName} ${dto.lastName}`;
    }

    if (dto.phone) {
      const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
      if (!phoneRegex.test(dto.phone)) {
        throw new Error('users.errors.invalidPhone');
      }
      updateData.phone = dto.phone;
    }

    if (dto.language) {
      updateData.language = dto.language;
    }

    if (dto.country) {
      if (!['ar', 'br'].includes(dto.country)) {
        throw new Error('users.errors.invalidCountry');
      }
      updateData.country = dto.country;
    }

    if (dto.birthdate) {
      const birthdateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
      if (!birthdateRegex.test(dto.birthdate)) {
        throw new Error('users.errors.invalidBirthdate');
      }
      updateData.birthdate = new Date(dto.birthdate);
    }

    if (dto.gender) {
      if (!['male', 'female'].includes(dto.gender)) {
        throw new Error('users.errors.invalidGender');
      }
      updateData.gender = dto.gender;
    }

    if (dto.maritalStatus) {
      const validStatuses = ['single', 'married', 'divorced', 'widowed', 'cohabiting', 'separated'];
      if (!validStatuses.includes(dto.maritalStatus)) {
        throw new Error('users.errors.invalidMaritalStatus');
      }
      updateData.maritalStatus = dto.maritalStatus;
    }

    if (dto.profilePicture) {
      if (dto.profilePicture.url) {
        updateData.image = dto.profilePicture.url;
      }
    }

    const updated = await this.userModel.updateProfile(userId, updateData);

    this.logger.info('[PROFILE] User profile updated successfully', { userId });

    return this.userMapper.toProfileUpdateResponseDto(updated);
  }

  async updateAddress(userId: string, dto: UpdateAddressDto): Promise<AddressUpdateResponseDto> {
    const required = ['zipCode', 'street', 'number', 'city', 'state'] as const;
    for (const k of required) {
      if (!dto[k] || String(dto[k]).trim().length === 0) {
        throw new Error('users.errors.invalidAddress');
      }
    }

    const user = await this.userModel.findByIdWithIdentities(userId);

    let targetIdentityId = user.defaultUserIdentityId || null;
    if (!targetIdentityId) {
      const identities = user.usersIdentities_usersIdentities_userIdTousers || [];
      identities.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      targetIdentityId = identities[0]?.id || null;
    }
    if (!targetIdentityId) {
      throw new Error('users.errors.identityNotFound');
    }

    const addressPayload = {
      zipCode: String(dto.zipCode).trim(),
      street: String(dto.street).trim(),
      number: String(dto.number).trim(),
      neighborhood: dto.neighborhood ? String(dto.neighborhood).trim() : null,
      city: String(dto.city).trim(),
      state: String(dto.state).trim(),
      complement: dto.complement ? String(dto.complement).trim() : null,
    };

    await this.identityModel.updateAddress(targetIdentityId, JSON.stringify(addressPayload));

    return this.userMapper.toAddressUpdateResponseDto(addressPayload);
  }

  private formatName(name: string): string {
    if (!name) return '';
    return name
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
