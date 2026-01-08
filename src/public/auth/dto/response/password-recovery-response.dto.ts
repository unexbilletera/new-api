export class ForgotPasswordResponseDto {
  message: string;
  debug?: string;
}

export class VerifyPasswordResponseDto {
  message: string;
}

export class UnlockAccountUserDto {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  status: string;
  access: string;
}

export class UnlockAccountResponseDto {
  user: UnlockAccountUserDto;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  message: string;
}
