import {
  IsString,
  IsEmail,
  IsOptional,
  IsObject,
  Matches,
  IsPhoneNumber,
} from 'class-validator';

export class StartUserOnboardingDto {
  @IsEmail()
  email: string;
}

export class VerifyOnboardingCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;

  @IsString()
  @Matches(/^(email|phone)$/)
  type: 'email' | 'phone';

  @IsOptional()
  @Matches(/^\+\d{12,14}$/, {
    message:
      'Phone must start with + followed by 12-14 digits (e.g., +5512988870530 for BR or +541127564556 for AR)',
  })
  phone?: string;
}

export class UpdateUserOnboardingDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @Matches(/^\+\d{12,14}$/, {
    message:
      'Phone must start with + followed by 12-14 digits (e.g., +5512988870530 for BR or +541127564556 for AR)',
  })
  phone?: string;

  @IsOptional()
  @Matches(/^\d{6}$/)
  password?: string;

  @IsOptional()
  @IsString()
  campaignCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, {
    message: 'Birthdate must be in YYYY-MM-DD format (e.g., 2004-10-29)',
  })
  birthdate?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  pep?: string;

  @IsOptional()
  @IsString()
  pepSince?: string;

  @IsOptional()
  @IsString()
  livenessImage?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsObject()
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

export class StartIdentityOnboardingDto {
  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @Matches(/^(ar|br)$/i)
  country?: string;

  @IsOptional()
  @IsString()
  documentType?: string;
}

export class UpdateIdentityOnboardingDto {
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  documentExpiration?: string;

  @IsOptional()
  @IsString()
  documentIssuer?: string;

  @IsOptional()
  @IsObject()
  biometricData?: any;
}

export class UploadArgentinaDocumentDto {
  @IsString()
  frontImage: string;

  @IsOptional()
  @IsString()
  backImage?: string;

  @IsOptional()
  @IsObject()
  pdf417Data?: {
    documentNumber?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    documentExpiration?: string;
  };
}
