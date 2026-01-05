import { IsEmail, IsString, Matches } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class VerifyPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;

  @IsString()
  @Matches(/^\d{6}$/)
  newPassword: string;
}

export class UnlockAccountDto {
  @IsEmail()
  email: string;
}
