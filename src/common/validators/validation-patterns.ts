/**
 * Centralized validation patterns for DTO field validation.
 * All patterns use English for semantic consistency.
 */

/**
 * Regular expression patterns for common validations
 */
export const ValidationPatterns = {
  /**
   * Verification code: exactly 6 digits
   * Used for: email verification, SMS verification, password recovery
   */
  CODE_6_DIGITS: /^\d{6}$/,

  /**
   * Password: exactly 6 digits
   * Used for: user password, transaction password
   */
  PASSWORD_6_DIGITS: /^\d{6}$/,

  /**
   * UUID format: standard UUID v4
   * Used for: all ID fields (accountId, userId, identityId, etc)
   */
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,

  /**
   * Date format: YYYY-MM-DD (ISO 8601)
   * Used for: birthdate, document expiration, pepSince
   */
  DATE_YYYY_MM_DD: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,

  /**
   * Phone number: international format with + and 12-14 digits
   * Used for: phone fields in onboarding and user profile
   */
  PHONE_INTERNATIONAL: /^\+\d{12,14}$/,

  /**
   * CPF: exactly 11 digits (Brazilian tax ID)
   * Used for: user CPF field
   */
  CPF: /^\d{11}$/,

  /**
   * CNPJ: exactly 14 digits (Brazilian company tax ID)
   * Used for: company registration
   */
  CNPJ: /^\d{14}$/,

  /**
   * ZIP code (Brazil): XXXXX-XXX format
   * Used for: Brazilian addresses
   */
  ZIP_CODE_BR: /^\d{5}-\d{3}$/,

  /**
   * Country code: 2-letter ISO code (uppercase or lowercase)
   * Used for: country fields
   */
  COUNTRY_CODE_2: /^[A-Z]{2}$/i,

  /**
   * State code: 2-letter code (uppercase or lowercase)
   * Used for: state/province fields
   */
  STATE_CODE_2: /^[A-Z]{2}$/i,

  /**
   * Language code: pt, es, or en
   * Used for: user language preference
   */
  LANGUAGE: /^(pt|es|en)$/i,

  /**
   * Timezone: IANA timezone format (Region/City)
   * Used for: user timezone preference
   */
  TIMEZONE: /^[A-Za-z_]+\/[A-Za-z_]+$/,

  /**
   * Gender: male or female (English only)
   * Used for: user gender field
   */
  GENDER: /^(male|female)$/i,

  /**
   * Marital status: English values only
   * Used for: user marital status field
   */
  MARITAL_STATUS: /^(single|married|divorced|widowed|cohabiting|separated)$/i,

  /**
   * PEP (Politically Exposed Person): 0 or 1
   * Used for: PEP declaration
   */
  PEP: /^[01]$/,

  /**
   * Validation type: email or phone
   * Used for: verification flow type
   */
  VALIDATION_TYPE: /^(email|phone)$/,

  /**
   * Version number: semantic versioning format (e.g., 14.5, 1.0.0)
   * Used for: system version, app version
   */
  VERSION: /^\d+(\.\d+)*$/,
} as const;

/**
 * Validation error messages
 */
export const ValidationMessages = {
  CODE_6_DIGITS: 'Code must be exactly 6 digits',
  PASSWORD_6_DIGITS: 'Password must be exactly 6 digits',
  UUID: 'Must be a valid UUID',
  DATE_YYYY_MM_DD: 'Date must be in YYYY-MM-DD format (e.g., 2004-10-29)',
  PHONE_INTERNATIONAL:
    'Phone must start with + followed by 12-14 digits (e.g., +5512988870530 for BR or +541127564556 for AR)',
  CPF: 'CPF must be exactly 11 digits',
  CNPJ: 'CNPJ must be exactly 14 digits',
  ZIP_CODE_BR: 'Zip code must be in format XXXXX-XXX',
  COUNTRY_CODE_2: 'Country must be a 2-letter ISO country code',
  STATE_CODE_2: 'State must be a 2-letter code',
  LANGUAGE: 'Language must be pt, es, or en',
  TIMEZONE: 'Timezone must be in format like America/Sao_Paulo',
  GENDER: 'Gender must be male or female',
  MARITAL_STATUS:
    'Marital status must be one of: single, married, divorced, widowed, cohabiting, separated',
  PEP: 'PEP must be "0" (not a PEP) or "1" (is a PEP)',
  VALIDATION_TYPE: 'Type must be email or phone',
  VERSION: 'System version must be in format like 14.5',
} as const;

/**
 * Validation options for @Matches decorator
 * Usage: @Matches(...ValidationOptions.CODE_6_DIGITS)
 */
export const ValidationOptions = {
  CODE_6_DIGITS: [
    ValidationPatterns.CODE_6_DIGITS,
    { message: ValidationMessages.CODE_6_DIGITS },
  ],
  PASSWORD_6_DIGITS: [
    ValidationPatterns.PASSWORD_6_DIGITS,
    { message: ValidationMessages.PASSWORD_6_DIGITS },
  ],
  UUID: [ValidationPatterns.UUID, { message: ValidationMessages.UUID }],
  DATE_YYYY_MM_DD: [
    ValidationPatterns.DATE_YYYY_MM_DD,
    { message: ValidationMessages.DATE_YYYY_MM_DD },
  ],
  PHONE_INTERNATIONAL: [
    ValidationPatterns.PHONE_INTERNATIONAL,
    { message: ValidationMessages.PHONE_INTERNATIONAL },
  ],
  CPF: [ValidationPatterns.CPF, { message: ValidationMessages.CPF }],
  CNPJ: [ValidationPatterns.CNPJ, { message: ValidationMessages.CNPJ }],
  ZIP_CODE_BR: [
    ValidationPatterns.ZIP_CODE_BR,
    { message: ValidationMessages.ZIP_CODE_BR },
  ],
  COUNTRY_CODE_2: [
    ValidationPatterns.COUNTRY_CODE_2,
    { message: ValidationMessages.COUNTRY_CODE_2 },
  ],
  STATE_CODE_2: [
    ValidationPatterns.STATE_CODE_2,
    { message: ValidationMessages.STATE_CODE_2 },
  ],
  LANGUAGE: [
    ValidationPatterns.LANGUAGE,
    { message: ValidationMessages.LANGUAGE },
  ],
  TIMEZONE: [
    ValidationPatterns.TIMEZONE,
    { message: ValidationMessages.TIMEZONE },
  ],
  GENDER: [ValidationPatterns.GENDER, { message: ValidationMessages.GENDER }],
  MARITAL_STATUS: [
    ValidationPatterns.MARITAL_STATUS,
    { message: ValidationMessages.MARITAL_STATUS },
  ],
  PEP: [ValidationPatterns.PEP, { message: ValidationMessages.PEP }],
  VALIDATION_TYPE: [
    ValidationPatterns.VALIDATION_TYPE,
    { message: ValidationMessages.VALIDATION_TYPE },
  ],
  VERSION: [
    ValidationPatterns.VERSION,
    { message: ValidationMessages.VERSION },
  ],
} as const;

/**
 * Specialized validation options with custom messages
 */
export const SpecializedValidationOptions = {
  CURRENT_PASSWORD: [
    ValidationPatterns.PASSWORD_6_DIGITS,
    { message: 'Current password must be exactly 6 digits' },
  ],
  NEW_PASSWORD: [
    ValidationPatterns.PASSWORD_6_DIGITS,
    { message: 'New password must be exactly 6 digits' },
  ],
  ACCOUNT_ID: [
    ValidationPatterns.UUID,
    { message: 'Account ID must be a valid UUID' },
  ],
  IDENTITY_ID: [
    ValidationPatterns.UUID,
    { message: 'Identity ID must be a valid UUID' },
  ],
  SOURCE_ACCOUNT_ID: [
    ValidationPatterns.UUID,
    { message: 'Source account ID must be a valid UUID' },
  ],
  DEVICE_IDENTIFIER: [
    ValidationPatterns.UUID,
    { message: 'Device identifier must be a valid UUID' },
  ],
  BIRTHDATE: [
    ValidationPatterns.DATE_YYYY_MM_DD,
    { message: 'Birthdate must be in YYYY-MM-DD format (e.g., 2004-10-29)' },
  ],
  PEP_SINCE: [
    ValidationPatterns.DATE_YYYY_MM_DD,
    { message: 'PEP since date must be in YYYY-MM-DD format' },
  ],
  DOCUMENT_EXPIRATION: [
    ValidationPatterns.DATE_YYYY_MM_DD,
    { message: 'Document expiration must be in YYYY-MM-DD format' },
  ],
  COUNTRY_AR_BR: [
    /^(ar|br)$/i,
    { message: 'Country must be "ar" (Argentina) or "br" (Brazil)' },
  ],
} as const;
