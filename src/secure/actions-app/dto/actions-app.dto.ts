import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';export enum ActionSection {
  HOME = 'home',
  BOTTOM_TAB = 'bottom_tab',
  MENU = 'menu',
  QUICK_ACTION = 'quick_action',
  SERVICES = 'services',
}export enum ActionType {
  NAVIGATION = 'navigation',
  MODE_CHANGE = 'mode_change',
  EXTERNAL_URL = 'external_url',
}export class ListActionsQueryDto {
  @IsEnum(ActionSection)
  @IsOptional()
  section?: ActionSection;

  @IsBoolean()
  @IsOptional()
  activeOnly?: boolean;
}export class ActionResponseDto {
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
}export class ModuleResponseDto {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
}export class LayoutResponseDto {
  homeActions: ActionResponseDto[];
  bottomTabActions: ActionResponseDto[];
  menuActions: ActionResponseDto[];
  quickActions: ActionResponseDto[];
  servicesActions: ActionResponseDto[];
  modules: ModuleResponseDto[];
}
