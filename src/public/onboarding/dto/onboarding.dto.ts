import {
  IsString,
  IsEmail,
  IsOptional,
  IsObject,
  Matches,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import {
  ValidationOptions,
  SpecializedValidationOptions,
} from 'src/common/validators';

export class StartUserOnboardingDto {
  @IsEmail()
  email: string;
}

export class VerifyOnboardingCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @Matches(...ValidationOptions.CODE_6_OR_8_DIGITS)
  code: string;

  @IsString()
  @Matches(...ValidationOptions.VALIDATION_TYPE)
  type: 'email' | 'phone';

  @IsOptional()
  @Matches(...ValidationOptions.PHONE_INTERNATIONAL)
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
  @Matches(...ValidationOptions.PHONE_INTERNATIONAL)
  phone?: string;

  @IsOptional()
  @Matches(...ValidationOptions.PASSWORD_6_DIGITS)
  password?: string;

  @IsOptional()
  @IsString()
  campaignCode?: string;

  @IsOptional()
  @IsString()
  @Matches(...SpecializedValidationOptions.COUNTRY_AR_BR)
  country?: string;

  @IsOptional()
  @IsString()
  @Matches(...SpecializedValidationOptions.BIRTHDATE)
  birthdate?: string;

  @IsOptional()
  @IsString()
  @Matches(...ValidationOptions.GENDER)
  gender?: string;

  @IsOptional()
  @IsString()
  @Matches(...ValidationOptions.MARITAL_STATUS)
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  @Matches(...ValidationOptions.PEP)
  pep?: string;

  @ValidateIf((o) => o.pep === '1')
  @IsNotEmpty({ message: 'pepSince is required when pep is 1' })
  @IsString()
  @Matches(...SpecializedValidationOptions.PEP_SINCE)
  pepSince?: string;

  @IsOptional()
  @IsString()
  @Matches(...ValidationOptions.IMAGE_DATA_URL)
  livenessImage?: string;

  @IsOptional()
  @IsString()
  @Matches(...ValidationOptions.CPF)
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
  @Matches(...ValidationOptions.COUNTRY_CODE_2)
  countryCode?: string;

  @IsOptional()
  @Matches(...SpecializedValidationOptions.COUNTRY_AR_BR)
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
  @Matches(...SpecializedValidationOptions.DOCUMENT_EXPIRATION)
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
  @Matches(...ValidationOptions.IMAGE_DATA_URL)
  frontImage: string;

  @IsOptional()
  @IsString()
  @Matches(...ValidationOptions.IMAGE_DATA_URL)
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
