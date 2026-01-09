export class UserProfileUpdateDto {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  name: string | null;
  language: string | null;
  country: string | null;
  birthdate: Date | null;
  gender: string | null;
  maritalStatus: string | null;
  image: string | null;
}

export class ProfileUpdateResponseDto {
  success: boolean;
  user: UserProfileUpdateDto;
}
