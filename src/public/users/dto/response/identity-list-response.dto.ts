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
    description: 'Tax document number (CPF/CNPJ)',
    example: '12345678901',
    nullable: true,
  })
  taxDocumentNumber: string | null;

  @ApiProperty({
    description: 'Tax document type',
    example: 'CPF',
    enum: ['CPF', 'CNPJ'],
    nullable: true,
  })
  taxDocumentType: string | null;

  @ApiProperty({
    description: 'Identity document number',
    example: '1234567',
    nullable: true,
  })
  identityDocumentNumber: string | null;

  @ApiProperty({
    description: 'Identity document type',
    example: 'RG',
    enum: ['RG', 'CNH', 'PASSPORT', 'DNI'],
    nullable: true,
  })
  identityDocumentType: string | null;

  @ApiProperty({
    description: 'Document validation status',
    example: 'APPROVED',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    nullable: true,
  })
  status: string | null;

  @ApiProperty({
    description: 'Document creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}

export class IdentityListResponseDto {
  @ApiProperty({
    description: "User's identity document list",
    type: [IdentityListItemDto],
  })
  identities: IdentityListItemDto[];
}
