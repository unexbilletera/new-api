import { IsEmail, IsString } from 'class-validator';

export class SendEmailValidationDto {
  @IsEmail()
  email: string;
}

export class VerifyEmailCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;
}
