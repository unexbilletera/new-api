import { ApiProperty } from '@nestjs/swagger';

export class AccountBalanceItemDto {
  @ApiProperty({
    description: "Account's unique ID",
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Account type',
    example: 'corrente',
    nullable: true,
  })
  type: string | null;

  @ApiProperty({
    description: 'Account currency',
    example: 'BRL',
    nullable: true,
  })
  currency: string | null;

  @ApiProperty({
    description: 'Account balance',
    example: '1500.50',
    nullable: true,
  })
  balance: string | null;

  @ApiProperty({
    description: 'Account alias',
    example: 'Main Account',
    nullable: true,
  })
  alias: string | null;

  @ApiProperty({
    description: 'Account status',
    example: 'active',
    nullable: true,
  })
  status: string | null;
}

export class AccountBalanceResponseDto {
  @ApiProperty({
    description: 'List of accounts with their balances',
    type: () => [AccountBalanceItemDto],
  })
  accounts: AccountBalanceItemDto[];
}
