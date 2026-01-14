import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PasswordHelper } from '../../../shared/helpers/password.helper';
import {
  CreateBackofficeUserDto,
  UpdateBackofficeUserDto,
  BackofficeUserResponseDto,
  ListBackofficeUsersQueryDto,
} from '../dto/backoffice-user.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class BackofficeUsersService {
  constructor(private prisma: PrismaService) {}
  async list(query: ListBackofficeUsersQueryDto): Promise<{
    data: BackofficeUserResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.roleId) {
      where.roleId = query.roleId;
    }

    const [data, total] = await Promise.all([
      this.prisma.backofficeUsers.findMany({
        where,
        include: { backofficeRoles: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.backofficeUsers.count({ where }),
    ]);

    return {
      data: data.map(this.mapToResponse),
      total,
      page,
      limit,
    };
  }
  async get(id: string): Promise<BackofficeUserResponseDto> {
    const user = await this.prisma.backofficeUsers.findFirst({
      where: { id, deletedAt: null },
      include: { backofficeRoles: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToResponse(user);
  }
  async create(
    dto: CreateBackofficeUserDto,
  ): Promise<BackofficeUserResponseDto> {
    const existing = await this.prisma.backofficeUsers.findFirst({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email já está em uso');
    }

    const role = await this.prisma.backofficeRoles.findFirst({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const hashedPassword = await PasswordHelper.hash(dto.password);

    const user = await this.prisma.backofficeUsers.create({
      data: {
        id: randomUUID(),
        name: dto.name,
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        roleId: dto.roleId,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: { backofficeRoles: true },
    });

    return this.mapToResponse(user);
  }
  async update(
    id: string,
    dto: UpdateBackofficeUserDto,
  ): Promise<BackofficeUserResponseDto> {
    const user = await this.prisma.backofficeUsers.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existing = await this.prisma.backofficeUsers.findFirst({
        where: { email: dto.email.toLowerCase() },
      });
      if (existing) {
        throw new ConflictException('Email já está em uso');
      }
    }

    if (dto.roleId) {
      const role = await this.prisma.backofficeRoles.findFirst({
        where: { id: dto.roleId },
      });
      if (!role) {
        throw new NotFoundException('Role not found');
      }
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (dto.name) updateData.name = dto.name;
    if (dto.email) updateData.email = dto.email.toLowerCase();
    if (dto.roleId) updateData.roleId = dto.roleId;
    if (dto.status) updateData.status = dto.status;
    if (dto.password) {
      updateData.password = await PasswordHelper.hash(dto.password);
    }

    const updated = await this.prisma.backofficeUsers.update({
      where: { id },
      data: updateData,
      include: { backofficeRoles: true },
    });

    return this.mapToResponse(updated);
  }
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.backofficeUsers.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.backofficeUsers.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true, message: 'User deleted successfully' };
  }

  private mapToResponse(user: any): BackofficeUserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      roleId: user.roleId,
      role: user.backofficeRoles
        ? {
            id: user.backofficeRoles.id,
            name: user.backofficeRoles.name,
            level: user.backofficeRoles.level,
          }
        : undefined,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
