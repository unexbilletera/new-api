export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
    level: number;
  };
  lastLoginAt?: Date | null;
  createdAt: Date;
}
