import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class ListOnboardingQueryDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

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
