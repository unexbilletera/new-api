export class ActionResponseDto {
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

export class ModuleResponseDto {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
}

export class LayoutResponseDto {
  homeActions: ActionResponseDto[];
  bottomTabActions: ActionResponseDto[];
  menuActions: ActionResponseDto[];
  quickActions: ActionResponseDto[];
  servicesActions: ActionResponseDto[];
  modules: ModuleResponseDto[];
}

export class ActionsWithModuleFilterResponseDto {
  data?: ActionResponseDto[];
}

export class ModuleStatusResponseDto {
  moduleKey: string;
  enabled: boolean;
}
