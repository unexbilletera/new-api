export class BackofficeUserResponseDto {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export class BackofficeUserDetailsDto extends BackofficeUserResponseDto {
  roles: { id: string; name: string }[];
  updatedAt: Date;
}

export class ListBackofficeUsersResponseDto {
  data: BackofficeUserResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class CreateBackofficeUserResponseDto {
  message: string;
  user: BackofficeUserDetailsDto;
}

export class UpdateBackofficeUserResponseDto {
  message: string;
  user: BackofficeUserDetailsDto;
}

export class DeleteBackofficeUserResponseDto {
  message: string;
  userId: string;
}
