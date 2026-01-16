import { ApiProperty } from '@nestjs/swagger';

export class AccountListItemDto {
  @ApiProperty({
    description: 'Account unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Account type',
    example: 'CHECKING',
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
    example: '1000.00',
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
    example: 'ACTIVE',
    nullable: true,
  })
  status: string | null;
}

export class AccountListResponseDto {
  @ApiProperty({
    description: "User's account list",
    type: () => [AccountListItemDto],
  })
  accounts: AccountListItemDto[];
}
