export class SigninUserDto {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

export class SigninResponseDto {
  user: SigninUserDto;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export class SigninDeviceRequiredResponseDto {
  deviceRequired: boolean;
  deviceType: string;
  message: string;
  userId: string;
  accessToken: string;
  user: SigninUserDto;
}
