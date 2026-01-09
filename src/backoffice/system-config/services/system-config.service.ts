import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
  ListSystemConfigQueryDto,
  CreateModuleDto,
  UpdateModuleDto,
} from '../dto/system-config.dto';

@Injectable()
export class SystemConfigService {
  constructor(private prisma: PrismaService) {}

  async listConfigs(query: ListSystemConfigQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (query.group) {
      where.category = query.group;
    }

    if (query.search) {
      where.key = { contains: query.search };
    }

    const [data, total] = await Promise.all([
      this.prisma.system_config.findMany({
        where,
        skip,
        take: limit,
        orderBy: { key: 'asc' },
      }),
      this.prisma.system_config.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getConfigByKey(key: string) {
    const config = await this.prisma.system_config.findFirst({
      where: { key, deletedAt: null },
    });

    if (!config) {
      throw new NotFoundException(`Configuration '${key}' not found`);
    }

    return config;
  }

  async createConfig(dto: CreateSystemConfigDto) {
    const existing = await this.prisma.system_config.findFirst({
      where: { key: dto.key, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException(`Configuration '${dto.key}' already exists`);
    }

    return this.prisma.system_config.create({
      data: {
        id: crypto.randomUUID(),
        key: dto.key,
        value: dto.value,
        description: dto.description,
        category: dto.group || 'general',
      },
    });
  }

  async updateConfig(id: string, dto: UpdateSystemConfigDto) {
    const config = await this.prisma.system_config.findFirst({
      where: { id, deletedAt: null },
    });

    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    return this.prisma.system_config.update({
      where: { id },
      data: {
        value: dto.value,
        description: dto.description,
        category: dto.group,
        updatedAt: new Date(),
      },
    });
  }

  async deleteConfig(id: string) {
    const config = await this.prisma.system_config.findFirst({
      where: { id, deletedAt: null },
    });

    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    await this.prisma.system_config.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true, message: 'Configuration deleted successfully' };
  }

  async listGroups() {
    const configs = await this.prisma.system_config.findMany({
      where: { deletedAt: null },
      select: { category: true },
      distinct: ['category'],
    });

    return configs.map((c) => c.category).filter(Boolean);
  }

  async listModules() {
    return this.prisma.modules.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getModule(id: number) {
    const module = await this.prisma.modules.findFirst({
      where: { id },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    return module;
  }

  async createModule(dto: CreateModuleDto) {
    const existing = await this.prisma.modules.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Module '${dto.name}' already exists`);
    }

    return this.prisma.modules.create({
      data: {
        name: dto.name,
        isActive: dto.isActive ? 1 : 0,
      },
    });
  }

  async updateModule(id: number, dto: UpdateModuleDto) {
    const module = await this.prisma.modules.findFirst({
      where: { id },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    return this.prisma.modules.update({
      where: { id },
      data: {
        name: dto.name,
        isActive: dto.isActive !== undefined ? (dto.isActive ? 1 : 0) : undefined,
        updatedAt: new Date(),
      },
    });
  }

  async deleteModule(id: number) {
    const module = await this.prisma.modules.findFirst({
      where: { id },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    await this.prisma.modules.delete({
      where: { id },
    });

    return { success: true, message: 'Module deleted successfully' };
  }

  async toggleModule(id: number, isActive: boolean) {
    const module = await this.prisma.modules.findFirst({
      where: { id },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    return this.prisma.modules.update({
      where: { id },
      data: { isActive: isActive ? 1 : 0, updatedAt: new Date() },
    });
  }
}
