import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto } from '../dto/role.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}
  async list(): Promise<RoleResponseDto[]> {
    const roles = await this.prisma.backofficeRoles.findMany({
      orderBy: { level: 'desc' },
    });

    return roles.map(this.mapToResponse);
  }
  async get(id: string): Promise<RoleResponseDto> {
    const role = await this.prisma.backofficeRoles.findFirst({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.mapToResponse(role);
  }
  async create(dto: CreateRoleDto): Promise<RoleResponseDto> {
    const existing = await this.prisma.backofficeRoles.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('A role with this name already exists');
    }

    const role = await this.prisma.backofficeRoles.create({
      data: {
        id: randomUUID(),
        name: dto.name,
        description: dto.description || null,
        level: dto.level,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return this.mapToResponse(role);
  }
  async update(id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.prisma.backofficeRoles.findFirst({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (dto.name && dto.name !== role.name) {
      const existing = await this.prisma.backofficeRoles.findFirst({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('A role with this name already exists');
      }
    }

    const updated = await this.prisma.backofficeRoles.update({
      where: { id },
      data: {
        name: dto.name ?? role.name,
        description: dto.description ?? role.description,
        level: dto.level ?? role.level,
        updatedAt: new Date(),
      },
    });

    return this.mapToResponse(updated);
  }
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const role = await this.prisma.backofficeRoles.findFirst({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const usersWithRole = await this.prisma.backofficeUsers.count({
      where: { roleId: id, deletedAt: null },
    });

    if (usersWithRole > 0) {
      throw new ConflictException(
        `Cannot delete. ${usersWithRole} user(s) using this role`,
      );
    }

    await this.prisma.backofficeRoles.delete({
      where: { id },
    });

    return { success: true, message: 'Role deleted successfully' };
  }

  private mapToResponse(role: any): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      level: role.level,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
