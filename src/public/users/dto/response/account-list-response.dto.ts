export class AccountListItemDto {
  id: string;
  type: string | null;
  currency: string | null;
  balance: string | null;
  alias: string | null;
  status: string | null;
}

export class AccountListResponseDto {
  accounts: AccountListItemDto[];
}
