export class IdentityListItemDto {
  id: string;
  country: string | null;
  taxDocumentNumber: string | null;
  taxDocumentType: string | null;
  identityDocumentNumber: string | null;
  identityDocumentType: string | null;
  status: string | null;
  createdAt: Date;
}

export class IdentityListResponseDto {
  identities: IdentityListItemDto[];
}
