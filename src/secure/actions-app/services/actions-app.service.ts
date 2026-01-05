import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  ActionSection,
  ActionResponseDto,
  ModuleResponseDto,
  LayoutResponseDto,
} from '../dto/actions-app.dto';

@Injectable()
export class ActionsAppService {
  constructor(private prisma: PrismaService) {}  async getHomeActions(activeOnly = true): Promise<ActionResponseDto[]> {
    const where: any = {
      deletedAt: null,
    };

    if (activeOnly) {
      where.active = true;
    }

    const actions = await this.prisma.home_actions.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return actions.map((a) => this.mapHomeAction(a));
  }  async getServicesActions(activeOnly = true): Promise<ActionResponseDto[]> {
    const where: any = {
      deletedAt: null,
    };

    if (activeOnly) {
      where.active = true;
    }

    const actions = await this.prisma.services_actions.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return actions.map((a) => this.mapServiceAction(a));
  }  async getActionsBySection(
    section: ActionSection,
    activeOnly = true,
  ): Promise<ActionResponseDto[]> {
    if (section === ActionSection.HOME) {
      return this.getHomeActions(activeOnly);
    }

    if (section === ActionSection.SERVICES) {
      return this.getServicesActions(activeOnly);
    }

    const where: any = {
      section,
      deletedAt: null,
    };

    if (activeOnly) {
      where.active = true;
    }

    const actions = await this.prisma.home_actions.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return actions.map((a) => this.mapHomeAction(a));
  }  async getModules(enabledOnly = false): Promise<ModuleResponseDto[]> {
    const where: any = {
      deletedAt: null,
    };

    if (enabledOnly) {
      where.enabled = true;
    }

    const modules = await this.prisma.modules.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return modules.map((m) => ({
      id: m.id,
      key: m.key,
      name: m.name,
      description: m.description || undefined,
      enabled: m.enabled,
    }));
  }  async isModuleEnabled(moduleKey: string): Promise<boolean> {
    const module = await this.prisma.modules.findFirst({
      where: {
        key: moduleKey,
        deletedAt: null,
      },
    });

    return module?.enabled ?? false;
  }  async getFullLayout(): Promise<LayoutResponseDto> {
    const [homeActions, servicesActions, modules] = await Promise.all([
      this.getHomeActions(true),
      this.getServicesActions(true),
      this.getModules(false),
    ]);

    const bottomTabActions = homeActions.filter(
      (a) => a.section === ActionSection.BOTTOM_TAB,
    );
    const menuActions = homeActions.filter(
      (a) => a.section === ActionSection.MENU,
    );
    const quickActions = homeActions.filter(
      (a) => a.section === ActionSection.QUICK_ACTION,
    );
    const homeOnlyActions = homeActions.filter(
      (a) => a.section === ActionSection.HOME || !a.section,
    );

    return {
      homeActions: homeOnlyActions,
      bottomTabActions,
      menuActions,
      quickActions,
      servicesActions,
      modules,
    };
  }  async getActionsWithModuleFilter(): Promise<ActionResponseDto[]> {
    const [homeActions, servicesActions, modules] = await Promise.all([
      this.getHomeActions(true),
      this.getServicesActions(true),
      this.getModules(true),
    ]);

    const enabledModuleKeys = new Set(modules.map((m) => m.key));

    const filteredHomeActions = homeActions.filter((a) => {
      if (!a.moduleKey) return true;
      return enabledModuleKeys.has(a.moduleKey);
    });

    const filteredServicesActions = servicesActions.filter((a) => {
      if (!a.moduleKey) return true;
      return enabledModuleKeys.has(a.moduleKey);
    });

    return [...filteredHomeActions, ...filteredServicesActions];
  }  private mapHomeAction(action: any): ActionResponseDto {
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
  }  private mapServiceAction(action: any): ActionResponseDto {
    return {
      id: action.id,
      section: 'services',
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
}
