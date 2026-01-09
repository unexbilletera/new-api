import { ApiProperty } from '@nestjs/swagger';

export class AddressDataDto {
  @ApiProperty({
    description: 'Postal code',
    example: '01310-100',
  })
  zipCode: string;

  @ApiProperty({
    description: 'Street name',
    example: 'Avenida Paulista',
  })
  street: string;

  @ApiProperty({
    description: 'Address number',
    example: '1578',
  })
  number: string;

  @ApiProperty({
    description: 'Address neighborhood',
    example: 'Bela Vista',
    nullable: true,
  })
  neighborhood: string | null;

  @ApiProperty({
    description: 'City',
    example: 'São Paulo',
  })
  city: string;

  @ApiProperty({
    description: 'State (abbreviation)',
    example: 'SP',
  })
  state: string;

  @ApiProperty({
    description: 'Address complement',
    example: 'Apto 101',
    nullable: true,
  })
  complement: string | null;
}

export class AddressUpdateResponseDto {
  @ApiProperty({
    description: 'Indicates if the address was updated successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Updated address data',
    type: AddressDataDto,
  })
  address: AddressDataDto;
}
