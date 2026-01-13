import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
export class ValidateCampaignCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
export class CampaignCodeResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType?: string;
  discountValue?: number;
  minAmount?: number;
  maxUses?: number;
  currentUses: number;
  startDate?: Date;
  endDate?: Date;
  active: boolean;
}
export class CampaignValidationResponseDto {
  valid: boolean;
  message: string;
  campaign?: CampaignCodeResponseDto;
  alreadyUsed?: boolean;
}
export class UseCampaignResponseDto {
  success: boolean;
  message: string;
  usageId?: string;
}
