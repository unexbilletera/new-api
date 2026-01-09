export class AddressDataDto {
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string | null;
  city: string;
  state: string;
  complement: string | null;
}

export class AddressUpdateResponseDto {
  success: boolean;
  address: AddressDataDto;
}
