import { Injectable } from '@nestjs/common';
import {
  BackofficeUserResponseDto,
  BackofficeUserDetailsDto,
  ListBackofficeUsersResponseDto,
  CreateBackofficeUserResponseDto,
  UpdateBackofficeUserResponseDto,
  DeleteBackofficeUserResponseDto,
} from '../dto/response';

@Injectable()
export class BackofficeUserMapper {
  toBackofficeUserResponseDto(user: any): BackofficeUserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  toBackofficeUserDetailsDto(user: any): BackofficeUserDetailsDto {
    const dto = this.toBackofficeUserResponseDto(user);
    return {
      ...dto,
      roles: (user.roles || []).map((r: any) => ({ id: r.id, name: r.name })),
      updatedAt: user.updatedAt,
    };
  }

  toListBackofficeUsersResponseDto(
    users: any[],
    total: number,
    page: number,
    limit: number,
  ): ListBackofficeUsersResponseDto {
    return {
      data: users.map((u) => this.toBackofficeUserResponseDto(u)),
      total,
      page,
      limit,
    };
  }

  toCreateBackofficeUserResponseDto(user: any): CreateBackofficeUserResponseDto {
    return {
      message: 'User created successfully',
      user: this.toBackofficeUserDetailsDto(user),
    };
  }

  toUpdateBackofficeUserResponseDto(user: any): UpdateBackofficeUserResponseDto {
    return {
      message: 'User updated successfully',
      user: this.toBackofficeUserDetailsDto(user),
    };
  }

  toDeleteBackofficeUserResponseDto(userId: string): DeleteBackofficeUserResponseDto {
    return {
      message: 'User deleted successfully',
      userId,
    };
  }
}
