import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ActionSection {
  HOME = 'home',
  BOTTOM_TAB = 'bottom_tab',
  MENU = 'menu',
  QUICK_ACTION = 'quick_action',
  SERVICES = 'services',
}

export class ListActionsQueryDto {
  @IsOptional()
  @IsEnum(ActionSection)
  section?: ActionSection;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;
}

export interface ActionResponseDto {
  id: string;
  section: string;
  type: string;
  name: string;
  title?: string;
  description?: string;
  icon?: string;
  iconUrl?: string;
  color?: string;
  route?: string;
  externalUrl?: string;
  order: number;
  active: boolean;
  requiresKyc?: boolean;
  requiresAuth?: boolean;
  moduleKey?: string;
}

export interface ModuleResponseDto {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
}

export interface ModuleStatusResponseDto {
  moduleKey: string;
  enabled: boolean;
}

export interface LayoutResponseDto {
  homeActions: ActionResponseDto[];
  bottomTabActions: ActionResponseDto[];
  menuActions: ActionResponseDto[];
  quickActions: ActionResponseDto[];
  servicesActions: ActionResponseDto[];
  modules: ModuleResponseDto[];
}

export interface ActionsWithModuleFilterResponseDto {
  actions: ActionResponseDto[];
}
