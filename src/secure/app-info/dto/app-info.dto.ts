import { IsString, IsOptional } from 'class-validator';
export class AppInfoResponseDto {
  minVersion: string;
  currentVersion?: string;
  updateRequired: boolean;
  updateUrl?: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  features: Record<string, boolean>;
}
export class NewsResponseDto {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  priority: number;
  startDate?: Date;
  endDate?: Date;
  active: boolean;
  createdAt: Date;
}
export class VersionCheckResponseDto {
  minVersion: string;
  currentVersion: string;
  userVersion: string;
  updateRequired: boolean;
  updateRecommended: boolean;
  updateUrl?: string;
}
export class CheckVersionQueryDto {
  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  platform?: string;
}
export class FullAppInfoResponseDto {
  info: AppInfoResponseDto;
  news: NewsResponseDto[];
  features: Record<string, boolean>;
}
