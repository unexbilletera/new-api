export class IdentityResponseDto {
  id: string;
  country: string | null;
  status: string | null;
  type: string | null;
  subtype: string | null;
  name: string | null;
  taxDocumentType: string | null;
  taxDocumentNumber: string | null;
  identityDocumentType: string | null;
  identityDocumentNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AccountResponseDto {
  id: string;
  number: string | null;
  type: string | null;
  status: string | null;
  cvu: string | null;
  alias: string | null;
  balance: string | null;
  createdAt: Date;
}

export class OnboardingStateDto {
  completedSteps: string[];
  needsCorrection: string[];
}

export class ExchangeRatesDto {
  [key: string]: number;
}

export class UserDataDto {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  status: string;
  access: string;
  language: string | null;
  country: string | null;
  birthdate: Date | null;
  gender: string | null;
  maritalStatus: string | null;
  pep: boolean;
  pepSince: Date | null;
  fatherName: string | null;
  motherName: string | null;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  livenessVerifiedAt: Date | null;
  onboardingState: OnboardingStateDto;
  usersIdentities: IdentityResponseDto[];
  usersAccounts: AccountResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

export class UserProfileResponseDto {
  success: boolean;
  user: UserDataDto;
  forceUpgrade: boolean;
  exchangeRates: ExchangeRatesDto | null;
}
