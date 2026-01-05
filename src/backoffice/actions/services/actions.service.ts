import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  CreateActionDto,
  UpdateActionDto,
  ListActionsQueryDto,
} from '../dto/actions.dto';

@Injectable()
export class ActionsService {
  constructor(private prisma: PrismaService) {}  async listActions(query: ListActionsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.activeOnly) {
      where.enabled = true;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { moduleName: { contains: query.search } },
      ];
    }

    if (query.group) {
      where.moduleName = query.group;
    }

    const [data, total] = await Promise.all([
      this.prisma.services_actions.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.services_actions.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }  async getAction(id: string) {
    const action = await this.prisma.services_actions.findFirst({
      where: { id },
    });

    if (!action) {
      throw new NotFoundException('Ação não encontrada');
    }

    return action;
  }  async createAction(dto: CreateActionDto) {
    const existing = await this.prisma.services_actions.findFirst({
      where: { name: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Ação '${dto.code}' já existe`);
    }

    return this.prisma.services_actions.create({
      data: {
        id: crypto.randomUUID(),
        name: dto.code,
        icon: dto.metadata?.icon || 'default',
        actionType: 'internal',
        actionValue: dto.description,
        order: dto.metadata?.order || 0,
        enabled: dto.isActive ?? true,
        moduleName: dto.group,
        updatedAt: new Date(),
      },
    });
  }  async updateAction(id: string, dto: UpdateActionDto) {
    const action = await this.prisma.services_actions.findFirst({
      where: { id },
    });

    if (!action) {
      throw new NotFoundException('Ação não encontrada');
    }

    return this.prisma.services_actions.update({
      where: { id },
      data: {
        actionValue: dto.description,
        moduleName: dto.group,
        enabled: dto.isActive,
        updatedAt: new Date(),
      },
    });
  }  async deleteAction(id: string) {
    const action = await this.prisma.services_actions.findFirst({
      where: { id },
    });

    if (!action) {
      throw new NotFoundException('Ação não encontrada');
    }

    await this.prisma.services_actions.delete({
      where: { id },
    });

    return { success: true, message: 'Ação deletada com sucesso' };
  }  async listGroups() {
    const actions = await this.prisma.services_actions.findMany({
      select: { moduleName: true },
      distinct: ['moduleName'],
    });

    return actions.map((a) => a.moduleName).filter(Boolean);
  }  async toggleAction(id: string, enabled: boolean) {
    const action = await this.prisma.services_actions.findFirst({
      where: { id },
    });

    if (!action) {
      throw new NotFoundException('Ação não encontrada');
    }

    return this.prisma.services_actions.update({
      where: { id },
      data: { enabled, updatedAt: new Date() },
    });
  }  async reorderActions(actions: { id: string; order: number }[]) {
    const updates = actions.map((action) =>
      this.prisma.services_actions.update({
        where: { id: action.id },
        data: { order: action.order, updatedAt: new Date() },
      }),
    );

    await Promise.all(updates);

    return { success: true, message: 'Ações reordenadas com sucesso' };
  }  async userCanPerformAction(userId: string, actionName: string): Promise<boolean> {
    const user = await this.prisma.backofficeUsers.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        backofficeRoles: true,
      },
    });

    if (!user || !user.backofficeRoles) {
      return false;
    }

    const action = await this.prisma.services_actions.findFirst({
      where: { name: actionName, enabled: true },
    });

    if (!action) {
      return false;
    }

    return user.backofficeRoles.level >= 2;
  }
}
