import { Injectable } from '@nestjs/common';
import {
  ActionResponseDto,
  ModuleResponseDto,
  LayoutResponseDto,
  ActionsWithModuleFilterResponseDto,
  ModuleStatusResponseDto,
} from '../dto/response';

@Injectable()
export class ActionsAppMapper {
  toActionResponseDto(action: any): ActionResponseDto {
    return {
      id: action.id,
      section: action.section || 'home',
      type: action.type || 'navigation',
      name: action.name,
      title: action.title || action.name,
      description: action.description || undefined,
      icon: action.icon || undefined,
      iconUrl: action.iconUrl || undefined,
      color: action.color || undefined,
      route: action.route || undefined,
      externalUrl: action.externalUrl || undefined,
      order: action.order || 0,
      active: action.active,
      requiresKyc: action.requiresKyc || false,
      requiresAuth: action.requiresAuth ?? true,
      moduleKey: action.moduleKey || undefined,
    };
  }

  toModuleResponseDto(module: any): ModuleResponseDto {
    return {
      id: module.id,
      key: module.key,
      name: module.name,
      description: module.description || undefined,
      enabled: module.enabled,
    };
  }

  toLayoutResponseDto(
    homeActions: ActionResponseDto[],
    bottomTabActions: ActionResponseDto[],
    menuActions: ActionResponseDto[],
    quickActions: ActionResponseDto[],
    servicesActions: ActionResponseDto[],
    modules: ModuleResponseDto[],
  ): LayoutResponseDto {
    return {
      homeActions,
      bottomTabActions,
      menuActions,
      quickActions,
      servicesActions,
      modules,
    };
  }

  toActionsWithModuleFilterResponseDto(
    actions: ActionResponseDto[],
  ): ActionsWithModuleFilterResponseDto {
    return { data: actions };
  }

  toModuleStatusResponseDto(
    moduleKey: string,
    enabled: boolean,
  ): ModuleStatusResponseDto {
    return {
      moduleKey,
      enabled,
    };
  }
}
