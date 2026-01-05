import { IsString, IsEmail, IsOptional, IsObject, Matches, IsPhoneNumber } from 'class-validator';

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
  @IsPhoneNumber('BR')
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
  @IsString()
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
