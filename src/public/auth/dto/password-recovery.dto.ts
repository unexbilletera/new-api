import { IsEmail, IsString, Matches, MinLength, IsOptional } from 'class-validator';

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
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, {
    message: 'users.errors.invalidId',
  })
  id: string;

  @IsString()
  @MinLength(1)
  password: string;

  @IsOptional()
  @IsString()
  systemVersion?: string;

  @IsOptional()
  mobileDevice?: any;

  @IsOptional()
  browser?: any;
}
