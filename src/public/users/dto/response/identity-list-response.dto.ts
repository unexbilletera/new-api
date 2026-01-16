import { ApiProperty } from '@nestjs/swagger';

export class IdentityListItemDto {
  @ApiProperty({
    description: 'Unique identifier of the identity document',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Country where the document was issued',
    example: 'BR',
    nullable: true,
  })
  country: string | null;

  @ApiProperty({
    description: 'Tax document type',
    example: 'CPF',
    enum: ['CPF', 'CNPJ'],
    nullable: true,
  })
  taxDocumentType: string | null;

  @ApiProperty({
    description: 'Identity document type',
    example: 'RG',
    enum: ['RG', 'CNH', 'PASSPORT', 'DNI'],
    nullable: true,
  })
  identityDocumentType: string | null;

  @ApiProperty({
    description: 'Document validation status',
    example: 'enable',
    nullable: true,
  })
  status: string | null;

  @ApiProperty({
    description: "Identity's type",
    example: 'personal',
    nullable: true,
  })
  type: string | null;

  @ApiProperty({
    description: 'Full name in identity',
    example: 'John Silva Santos',
    nullable: true,
  })
  name: string | null;
}

export class IdentityListResponseDto {
  @ApiProperty({
    description: "User's identity document list",
    type: () => [IdentityListItemDto],
  })
  identities: IdentityListItemDto[];
}
