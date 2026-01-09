import { ApiProperty } from '@nestjs/swagger';

export class IdentityResponseDto {
  @ApiProperty({
    description: "Identity's unique ID",
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: "Identity's country",
    example: 'BR',
    nullable: true,
  })
  country: string | null;

  @ApiProperty({
    description: "Identity's status",
    example: 'active',
    nullable: true,
  })
  status: string | null;

  @ApiProperty({
    description: "Identity's type",
    example: 'individual',
    nullable: true,
  })
  type: string | null;

  @ApiProperty({
    description: "Identity's subtype",
    example: 'person',
    nullable: true,
  })
  subtype: string | null;

  @ApiProperty({
    description: 'Full name in identity',
    example: 'John Silva Santos',
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    description: 'Tax document type',
    example: 'CPF',
    nullable: true,
  })
  taxDocumentType: string | null;

  @ApiProperty({
    description: 'Tax document number',
    example: '12345678900',
    nullable: true,
  })
  taxDocumentNumber: string | null;

  @ApiProperty({
    description: 'Identity document type',
    example: 'RG',
    nullable: true,
  })
  identityDocumentType: string | null;

  @ApiProperty({
    description: 'Identity document number',
    example: '123456789',
    nullable: true,
  })
  identityDocumentNumber: string | null;

  @ApiProperty({
    description: 'Identity creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Identity last update date',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

export class AccountResponseDto {
  @ApiProperty({
    description: "Account's unique ID",
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Account number',
    example: '123456-7',
    nullable: true,
  })
  number: string | null;

  @ApiProperty({
    description: 'Account type',
    example: 'corrente',
    nullable: true,
  })
  type: string | null;

  @ApiProperty({
    description: 'Account status',
    example: 'active',
    nullable: true,
  })
  status: string | null;

  @ApiProperty({
    description: "Account's CVU",
    example: '0000003100010000000001',
    nullable: true,
  })
  cvu: string | null;

  @ApiProperty({
    description: 'Account alias',
    example: 'Main Account',
    nullable: true,
  })
  alias: string | null;

  @ApiProperty({
    description: 'Account balance',
    example: '1500.50',
    nullable: true,
  })
  balance: string | null;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}

export class OnboardingStateDto {
  @ApiProperty({
    description: 'Completed onboarding steps',
    type: [String],
    example: ['email_verification', 'phone_verification'],
  })
  completedSteps: string[];

  @ApiProperty({
    description: 'Steps that need correction',
    type: [String],
    example: ['identity_document'],
  })
  needsCorrection: string[];
}

export class ExchangeRatesDto {
  [key: string]: any;
}

export class UserDataDto {
  @ApiProperty({
    description: "User's unique ID",
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: "User's email address",
    example: 'usuario@exemplo.com',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    description: "User's phone number",
    example: '+5511987654321',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: "User's first name",
    example: 'John',
    nullable: true,
  })
  firstName: string | null;

  @ApiProperty({
    description: "User's last name",
    example: 'Silva',
    nullable: true,
  })
  lastName: string | null;

  @ApiProperty({
    description: "User's full name",
    example: 'John Silva Santos',
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    description: "User account's status",
    example: 'active',
  })
  status: string;

  @ApiProperty({
    description: "User's access level",
    example: 'user',
  })
  access: string;

  @ApiProperty({
    description: "User's preferred language",
    example: 'pt',
    nullable: true,
  })
  language: string | null;

  @ApiProperty({
    description: "User's country",
    example: 'BR',
    nullable: true,
  })
  country: string | null;

  @ApiProperty({
    description: "User's birth date",
    example: '1990-01-15T00:00:00Z',
    nullable: true,
  })
  birthdate: Date | null;

  @ApiProperty({
    description: "User's gender",
    example: 'masculino',
    nullable: true,
  })
  gender: string | null;

  @ApiProperty({
    description: "User's marital status",
    example: 'solteiro',
    nullable: true,
  })
  maritalStatus: string | null;

  @ApiProperty({
    description: 'Indicates if the user is a Politically Exposed Person',
    example: false,
  })
  pep: boolean;

  @ApiProperty({
    description: 'Date since when the user is a PEP',
    example: '2020-01-15T00:00:00Z',
    nullable: true,
  })
  pepSince: Date | null;

  @ApiProperty({
    description: "User's father name",
    example: 'José Silva',
    nullable: true,
  })
  fatherName: string | null;

  @ApiProperty({
    description: "User's mother name",
    example: 'Maria Santos',
    nullable: true,
  })
  motherName: string | null;

  @ApiProperty({
    description: 'Email verification date',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  emailVerifiedAt: Date | null;

  @ApiProperty({
    description: 'Phone verification date',
    example: '2024-01-15T10:35:00Z',
    nullable: true,
  })
  phoneVerifiedAt: Date | null;

  @ApiProperty({
    description: 'Liveness verification date',
    example: '2024-01-15T11:00:00Z',
    nullable: true,
  })
  livenessVerifiedAt: Date | null;

  @ApiProperty({
    description: 'Onboarding process state',
    type: () => OnboardingStateDto,
  })
  onboardingState: OnboardingStateDto;

  @ApiProperty({
    description: "User's associated identities",
    type: () => [IdentityResponseDto],
  })
  usersIdentities: IdentityResponseDto[];

  @ApiProperty({
    description: "User's associated accounts",
    type: () => [AccountResponseDto],
  })
  usersAccounts: AccountResponseDto[];

  @ApiProperty({
    description: 'User creation date',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: "User's last update date",
    example: '2024-01-15T11:30:00Z',
  })
  updatedAt: Date;
}

export class UserProfileResponseDto {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "User profile's complete data",
    type: () => UserDataDto,
  })
  user: UserDataDto;

  @ApiProperty({
    description: 'Indicates if it is necessary to force an application update',
    example: false,
  })
  forceUpgrade: boolean;

  @ApiProperty({
    description: 'Current exchange rates',
    type: () => ExchangeRatesDto,
    nullable: true,
  })
  exchangeRates: ExchangeRatesDto | null;
}
