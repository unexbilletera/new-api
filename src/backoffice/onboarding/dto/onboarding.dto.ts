import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListOnboardingQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class RejectUserDto {
  @IsArray()
  stepsToCorrect: string[];

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ApproveUserDto {
  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  identityId?: string;

  @IsString()
  @IsOptional()
  country?: string;
}

export class RequestCorrectionDto {
  @IsArray()
  stepsToCorrect: string[];

  @IsString()
  @IsOptional()
  message?: string;
}

export class UpdateUserInfoDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class OnboardingUserDto {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  onboardingState: any;
  country: string | null;
  createdAt: Date;
  identities: {
    id: string;
    country: string | null;
    status: string | null;
    type: string | null;
  }[];
}
