import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  ActionSection,
  ActionResponseDto,
  ModuleResponseDto,
  LayoutResponseDto,
} from '../dto/actions-app.dto';
import {
  ActionResponseDto as ResponseActionResponseDto,
  ModuleResponseDto as ResponseModuleResponseDto,
  LayoutResponseDto as ResponseLayoutResponseDto,
} from '../dto/response';

@Injectable()
export class ActionsAppService {
  constructor(private prisma: PrismaService) {}
  async getHomeActions(
    activeOnly = true,
  ): Promise<ResponseActionResponseDto[]> {
    const where: any = {};

    if (activeOnly) {
      where.enabled = true;
    }

    const actions = await this.prisma.home_actions.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return actions.map((a) => this.mapHomeAction(a));
  }
  async getServicesActions(
    activeOnly = true,
  ): Promise<ResponseActionResponseDto[]> {
    const where: any = {};

    if (activeOnly) {
      where.enabled = true;
    }

    const actions = await this.prisma.services_actions.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return actions.map((a) => this.mapServiceAction(a));
  }
  async getActionsBySection(
    section: ActionSection,
    activeOnly = true,
  ): Promise<ResponseActionResponseDto[]> {
    if (section === ActionSection.HOME) {
      return this.getHomeActions(activeOnly);
    }

    if (section === ActionSection.SERVICES) {
      return this.getServicesActions(activeOnly);
    }

    const where: any = {
      section,
    };

    if (activeOnly) {
      where.enabled = true;
    }

    const actions = await this.prisma.home_actions.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return actions.map((a) => this.mapHomeAction(a));
  }
  async getModules(enabledOnly = false): Promise<ModuleResponseDto[]> {
    const where: any = {};

    if (enabledOnly) {
      where.isActive = 1;
    }

    const modules = await this.prisma.modules.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return modules.map((m) => ({
      id: String(m.id),
      key: m.name.toLowerCase(),
      name: m.name,
      description: undefined,
      enabled: m.isActive === 1,
    }));
  }
  async isModuleEnabled(moduleKey: string): Promise<boolean> {
    const module = await this.prisma.modules.findFirst({
      where: {
        name: { contains: moduleKey },
        isActive: 1,
      },
    });

    return module?.isActive === 1;
  }
  async getFullLayout(): Promise<ResponseLayoutResponseDto> {
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
  }
  async getActionsWithModuleFilter(): Promise<ResponseActionResponseDto[]> {
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
  }
  private mapHomeAction(action: any): ResponseActionResponseDto {
    return {
      id: action.id,
      section: action.section || ActionSection.HOME,
      type: action.actionType || 'navigation',
      name: action.name,
      title: action.name,
      description: action.description || undefined,
      icon: action.icon || undefined,
      iconUrl: undefined,
      color: undefined,
      route: action.actionValue || undefined,
      externalUrl:
        action.actionType === 'external_url' ? action.actionValue : undefined,
      order: action.order || 0,
      active: action.enabled !== false,
      requiresKyc: false,
      requiresAuth: true,
      moduleKey: action.moduleName || undefined,
    };
  }
  private mapServiceAction(action: any): ResponseActionResponseDto {
    return {
      id: action.id,
      section: ActionSection.SERVICES,
      type: action.actionType || 'navigation',
      name: action.name,
      title: action.name,
      description: action.description || undefined,
      icon: action.icon || undefined,
      iconUrl: undefined,
      color: undefined,
      route: action.actionValue || undefined,
      externalUrl:
        action.actionType === 'external_url' ? action.actionValue : undefined,
      order: action.order || 0,
      active: action.enabled !== false,
      requiresKyc: false,
      requiresAuth: true,
      moduleKey: action.moduleName || undefined,
    };
  }
}
