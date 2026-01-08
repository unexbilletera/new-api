import { IsEmail, IsString, IsPhoneNumber, IsOptional, Matches, IsIn } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Password must be exactly 6 digits' })
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  phone: string;

  @IsString()
  @IsIn(['es', 'pt', 'en'])
  language: string;

  @IsOptional()
  @IsString()
  deviceIdentifier?: string;

  @IsOptional()
  mobileDevice?: any;

  @IsOptional()
  browser?: any;
}
