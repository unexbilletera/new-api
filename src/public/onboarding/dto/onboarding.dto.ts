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
  @Matches(/^\d{6}$/, {
    message: 'Code must be exactly 6 digits',
  })
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
  @Matches(/^\d{6}$/, {
    message: 'Password must be exactly 6 digits',
  })
  password?: string;

  @IsOptional()
  @IsString()
  campaignCode?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(ar|br)$/i, {
    message: 'Country must be "ar" (Argentina) or "br" (Brazil)',
  })
  country?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, {
    message: 'Birthdate must be in YYYY-MM-DD format (e.g., 2004-10-29)',
  })
  birthdate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(male|female)$/i, {
    message: 'Gender must be "male" or "female"',
  })
  gender?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(single|married|divorced|widowed|cohabiting|separated)$/i, {
    message:
      'Marital status must be one of: "single", "married", "divorced", "widowed", "cohabiting", "separated"',
  })
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[01]$/, {
    message: 'PEP must be "0" (not a PEP) or "1" (is a PEP)',
  })
  pep?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, {
    message: 'PEP since date must be in YYYY-MM-DD format',
  })
  pepSince?: string;

  @IsOptional()
  @IsString()
  livenessImage?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{11}$/, {
    message: 'CPF must be exactly 11 digits',
  })
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
  @Matches(/^[A-Z]{2}$/i, {
    message: 'Country code must be a 2-letter ISO country code',
  })
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
  @Matches(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, {
    message: 'Document expiration must be in YYYY-MM-DD format',
  })
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
