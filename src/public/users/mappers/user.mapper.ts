import { Injectable } from '@nestjs/common';
import {
  UserProfileResponseDto,
  UserProfileFullResponseDto,
  IdentityResponseDto,
  IdentityLightDto,
  AccountResponseDto,
  AccountLightDto,
  ExchangeRatesDto,
  EmailChangeRequestResponseDto,
  EmailChangeConfirmResponseDto,
  ProfileUpdateResponseDto,
  PasswordChangeResponseDto,
  AddressUpdateResponseDto,
} from '../dto/response';

@Injectable()
export class UserMapper {
  toProfileResponseDto(
    user: any,
    options?: { exchangeRates?: ExchangeRatesDto; forceUpgrade?: boolean },
  ): UserProfileResponseDto {
    const onboardingState = (user.onboardingState as any) || {
      completedSteps: [],
      needsCorrection: [],
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        status: user.status,
        access: user.access,
        language: user.language,
        country: user.country,
        birthdate: user.birthdate,
        gender: user.gender,
        maritalStatus: user.maritalStatus,
        emailVerified: !!user.emailVerifiedAt,
        phoneVerified: !!user.phoneVerifiedAt,
        livenessVerified: !!user.livenessVerifiedAt,
        onboardingState,
        usersIdentities: user.usersIdentities.map((i: any) =>
          this.toIdentityLightDto(i),
        ),
        usersAccounts: user.usersAccounts.map((a: any) =>
          this.toAccountLightDto(a),
        ),
        createdAt: user.createdAt,
      },
      forceUpgrade: options?.forceUpgrade || false,
      ...(options?.exchangeRates && { exchangeRates: options.exchangeRates }),
    };
  }

  toProfileFullResponseDto(
    user: any,
    options?: { exchangeRates?: ExchangeRatesDto; forceUpgrade?: boolean },
  ): UserProfileFullResponseDto {
    const onboardingState = (user.onboardingState as any) || {
      completedSteps: [],
      needsCorrection: [],
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        status: user.status,
        access: user.access,
        language: user.language,
        country: user.country,
        birthdate: user.birthdate,
        gender: user.gender,
        maritalStatus: user.maritalStatus,
        pep: user.pep,
        pepSince: user.pepSince,
        fatherName: user.fatherName,
        motherName: user.motherName,
        emailVerifiedAt: user.emailVerifiedAt,
        phoneVerifiedAt: user.phoneVerifiedAt,
        livenessVerifiedAt: user.livenessVerifiedAt,
        onboardingState,
        usersIdentities: user.usersIdentities.map((i: any) =>
          this.toIdentityResponseDto(i),
        ),
        usersAccounts: user.usersAccounts.map((a: any) =>
          this.toAccountResponseDto(a),
        ),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      forceUpgrade: options?.forceUpgrade || false,
      exchangeRates: options?.exchangeRates || null,
    };
  }

  private toIdentityLightDto(identity: any): IdentityLightDto {
    return {
      id: identity.id,
      country: identity.country,
      status: identity.status,
      type: identity.type,
      subtype: identity.subtype,
      name: identity.name,
    };
  }

  private toIdentityResponseDto(identity: any): IdentityResponseDto {
    return {
      id: identity.id,
      country: identity.country,
      status: identity.status,
      type: identity.type,
      subtype: identity.subtype,
      name: identity.name,
      taxDocumentType: identity.taxDocumentType,
      taxDocumentNumber: identity.taxDocumentNumber,
      identityDocumentType: identity.identityDocumentType,
      identityDocumentNumber: identity.identityDocumentNumber,
      createdAt: identity.createdAt,
      updatedAt: identity.updatedAt,
    };
  }

  private toAccountLightDto(account: any): AccountLightDto {
    return {
      id: account.id,
      type: account.type,
      status: account.status,
      cvu: account.cvu,
      alias: account.alias,
      balance: account.balance?.toString() || null,
    };
  }

  private toAccountResponseDto(account: any): AccountResponseDto {
    return {
      id: account.id,
      number: account.number,
      type: account.type,
      status: account.status,
      cvu: account.cvu,
      alias: account.alias,
      balance: account.balance?.toString() || null,
      createdAt: account.createdAt,
    };
  }

  toEmailChangeRequestResponseDto(
    email: string,
    expiresIn: number,
  ): EmailChangeRequestResponseDto {
    return {
      success: true,
      message: 'users.messages.emailChangeCodeSent',
      email,
      expiresIn,
    };
  }

  toEmailChangeConfirmResponseDto(
    email: string,
  ): EmailChangeConfirmResponseDto {
    return {
      success: true,
      message: 'users.messages.emailChangedSuccessfully',
      email,
    };
  }

  toProfileUpdateResponseDto(user: any): ProfileUpdateResponseDto {
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        name: user.name,
        language: user.language,
        country: user.country,
        birthdate: user.birthdate,
        gender: user.gender,
        maritalStatus: user.maritalStatus,
        image: user.image,
      },
    };
  }

  toPasswordChangeResponseDto(): PasswordChangeResponseDto {
    return {
      success: true,
      message: 'users.messages.passwordChangedSuccessfully',
    };
  }

  toAddressUpdateResponseDto(addressData: any): AddressUpdateResponseDto {
    return {
      success: true,
      address: addressData,
    };
  }
}
