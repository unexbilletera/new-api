import { IsPhoneNumber, IsString } from 'class-validator';

export class SendPhoneValidationDto {
  @IsPhoneNumber('BR')
  phone: string;
}

export class VerifyPhoneCodeDto {
  @IsPhoneNumber('BR')
  phone: string;

  @IsString()
  code: string;
}
