import { Injectable } from '@nestjs/common';
import {
  RoleResponseDto,
  ListRolesResponseDto,
  CreateRoleResponseDto,
  UpdateRoleResponseDto,
  DeleteRoleResponseDto,
  AssignPermissionResponseDto,
} from '../dto/response';

@Injectable()
export class RoleMapper {
  toRoleResponseDto(role: any): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      status: role.status,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: (role.permissions || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
      })),
    };
  }

  toListRolesResponseDto(
    roles: any[],
    total: number,
    page: number,
    limit: number,
  ): ListRolesResponseDto {
    return {
      data: roles.map((r) => this.toRoleResponseDto(r)),
      total,
      page,
      limit,
    };
  }

  toCreateRoleResponseDto(role: any): CreateRoleResponseDto {
    return {
      message: 'Role created successfully',
      role: this.toRoleResponseDto(role),
    };
  }

  toUpdateRoleResponseDto(role: any): UpdateRoleResponseDto {
    return {
      message: 'Role updated successfully',
      role: this.toRoleResponseDto(role),
    };
  }

  toDeleteRoleResponseDto(roleId: string): DeleteRoleResponseDto {
    return {
      message: 'Role deleted successfully',
      roleId,
    };
  }

  toAssignPermissionResponseDto(role: any): AssignPermissionResponseDto {
    return {
      message: 'Permissions assigned successfully',
      roleId: role.id,
      permissions: (role.permissions || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
      })),
    };
  }
}
