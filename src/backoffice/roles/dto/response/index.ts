export class RolePermissionDto {
  id: string;
  name: string;
  description: string;
}

export class RoleResponseDto {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: RolePermissionDto[];
}

export class ListRolesResponseDto {
  data: RoleResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class CreateRoleResponseDto {
  message: string;
  role: RoleResponseDto;
}

export class UpdateRoleResponseDto {
  message: string;
  role: RoleResponseDto;
}

export class DeleteRoleResponseDto {
  message: string;
  roleId: string;
}

export class AssignPermissionResponseDto {
  message: string;
  roleId: string;
  permissions: RolePermissionDto[];
}
