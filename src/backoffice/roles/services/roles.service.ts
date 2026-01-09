import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto } from '../dto/role.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}  async list(): Promise<RoleResponseDto[]> {
    const roles = await this.prisma.backofficeRoles.findMany({
      orderBy: { level: 'desc' },
    });

    return roles.map(this.mapToResponse);
  }  async get(id: string): Promise<RoleResponseDto> {
    const role = await this.prisma.backofficeRoles.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role não encontrada');
    }

    return this.mapToResponse(role);
  }  async create(dto: CreateRoleDto): Promise<RoleResponseDto> {

    const existing = await this.prisma.backofficeRoles.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Já existe uma role com este nome');
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
  }  async update(id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.prisma.backofficeRoles.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role não encontrada');
    }

    if (dto.name && dto.name !== role.name) {
      const existing = await this.prisma.backofficeRoles.findFirst({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('Já existe uma role com este nome');
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
  }  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const role = await this.prisma.backofficeRoles.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role não encontrada');
    }

    const usersWithRole = await this.prisma.backofficeUsers.count({
      where: { roleId: id, deletedAt: null },
    });

    if (usersWithRole > 0) {
      throw new ConflictException(
        `Não é possível deletar. ${usersWithRole} usuário(s) usando esta role`,
      );
    }

    await this.prisma.backofficeRoles.delete({
      where: { id },
    });

    return { success: true, message: 'Role deletada com sucesso' };
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
