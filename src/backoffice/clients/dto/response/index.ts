export class ClientIdentityDto {
  id: string;
  type: string;
  country: string;
  taxDocumentNumber: string | null;
  status: string;
}

export class ClientResponseDto {
  id: string;
  name: string;
  email: string;
  username: string;
  status: string;
  isBlocked: boolean;
  isDisabled: boolean;
  lastLoginAt: Date | null;
  identities: ClientIdentityDto[];
}

export class ClientDetailsDto extends ClientResponseDto {
  createdAt: Date;
  updatedAt: Date;
  blockReason: string | null;
  blockedAt: Date | null;
  accounts: any[];
}

export class ListClientsResponseDto {
  data: ClientResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class UpdateClientResponseDto {
  message: string;
  client: ClientDetailsDto;
}

export class BlockClientResponseDto {
  message: string;
  clientId: string;
  blocked: boolean;
}

export class UnblockClientResponseDto {
  message: string;
  clientId: string;
  blocked: boolean;
}

export class DisableClientResponseDto {
  message: string;
  clientId: string;
  disabled: boolean;
}

export class EnableClientResponseDto {
  message: string;
  clientId: string;
  disabled: boolean;
}
