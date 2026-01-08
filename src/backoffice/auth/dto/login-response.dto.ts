export class LoginResponseDto {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: {
      id: string;
      name: string;
      level: number;
    };
  };
  message: string;
  code: string;
}

