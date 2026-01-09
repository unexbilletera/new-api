export class EmailValidationResponseDto {
  message: string;
  debug?: string;
}

export class EmailCodeVerificationResponseDto {
  message: string;
  email: string;
  nextStep: string;
}

export class PhoneValidationResponseDto {
  message: string;
  debug?: string;
}

export class PhoneCodeVerificationResponseDto {
  message: string;
  phone: string;
  nextStep: string;
}
