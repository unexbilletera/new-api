import { IsString, MinLength, IsOptional } from 'class-validator';

export class SigninDto {
  @IsString()
  identifier: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  systemVersion?: string;

  @IsOptional()
  @IsString()
  deviceIdentifier?: string;

  @IsOptional()
  mobileDevice?: any;

  @IsOptional()
  browser?: any;
}
