export class TermCheckResponseDto {
  accepted: boolean;
  serviceType: string;
  acceptedAt?: Date;
  version?: string;
}

export class TermAcceptanceResponseDto {
  id: string;
  userId: string;
  serviceType: string;
  version?: string;
  acceptedAt: Date;
  ipAddress?: string;
}

export class AcceptTermResponseDto {
  success: boolean;
  message: string;
  data?: TermAcceptanceResponseDto;
}

export class ListAcceptancesResponseDto {
  data: TermAcceptanceResponseDto[];
}

export class CheckAllRequiredResponseDto {
  allAccepted: boolean;
  missing: string[];
  accepted: string[];
}
