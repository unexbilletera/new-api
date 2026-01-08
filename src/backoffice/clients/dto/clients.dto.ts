import { IsOptional, IsString, IsDateString, IsEnum, IsUUID } from 'class-validator';

export class ListClientsQueryDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class BlockClientDto {
  @IsString()
  reason: string;
}

export class ClientResponseDto {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  phone: string | null;
  clientOrigin: string | null;
  accountTypes: string[];
  accountOrigins: string[];
  documentNumbers: { country: string; number: string }[];
  status: string | null;
  isBlocked: boolean;
  blockedReason: string | null;
  isDisabled: boolean;
  disabledReason: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export class ClientDetailsDto extends ClientResponseDto {
  identities: {
    id: string;
    type: string | null;
    country: string | null;
    taxDocumentNumber: string | null;
    status: string | null;
    createdAt: Date;
  }[];
  accounts: {
    id: string;
    type: string | null;
    balance: string | null;
    status: string | null;
  }[];
}
