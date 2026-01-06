export class SignupUserDto {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

export class SignupResponseDto {
  deviceRequired?: boolean;
  deviceType?: string;
  message?: string;
  userId?: string;
  user: SignupUserDto;
  accessToken: string;
  expiresIn: number;
}

export class SignupDeviceRequiredResponseDto {
  deviceRequired: boolean;
  deviceType: string;
  message: string;
  userId: string;
  accessToken: string;
  user: SignupUserDto;
}
