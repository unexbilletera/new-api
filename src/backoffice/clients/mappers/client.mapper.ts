import { Injectable } from '@nestjs/common';
import {
  ClientResponseDto,
  ClientDetailsDto,
  ListClientsResponseDto,
  UpdateClientResponseDto,
  BlockClientResponseDto,
  UnblockClientResponseDto,
  DisableClientResponseDto,
  EnableClientResponseDto,
} from '../dto/response';

@Injectable()
export class ClientMapper {
  toClientResponseDto(user: any): ClientResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      status: user.status,
      isBlocked: user.isBlocked,
      isDisabled: user.isDisabled,
      lastLoginAt: user.lastLoginAt,
      identities: (
        user.usersIdentities_usersIdentities_userIdTousers || []
      ).map((i: any) => ({
        id: i.id,
        type: i.type,
        country: i.country,
        taxDocumentNumber: i.taxDocumentNumber,
        status: i.status,
      })),
    };
  }

  toClientDetailsDto(user: any): ClientDetailsDto {
    const dto = this.toClientResponseDto(user);
    return {
      ...dto,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      blockReason: user.blockReason,
      blockedAt: user.blockedAt,
      accounts: user.usersAccounts || [],
    };
  }

  toListClientsResponseDto(
    users: any[],
    total: number,
    page: number,
    limit: number,
  ): ListClientsResponseDto {
    return {
      data: users.map((u) => this.toClientResponseDto(u)),
      total,
      page,
      limit,
    };
  }

  toUpdateClientResponseDto(user: any): UpdateClientResponseDto {
    return {
      message: 'Client updated successfully',
      client: this.toClientDetailsDto(user),
    };
  }

  toBlockClientResponseDto(clientId: string): BlockClientResponseDto {
    return {
      message: 'Client blocked successfully',
      clientId,
      blocked: true,
    };
  }

  toUnblockClientResponseDto(clientId: string): UnblockClientResponseDto {
    return {
      message: 'Client unblocked successfully',
      clientId,
      blocked: false,
    };
  }

  toDisableClientResponseDto(clientId: string): DisableClientResponseDto {
    return {
      message: 'Client disabled successfully',
      clientId,
      disabled: true,
    };
  }

  toEnableClientResponseDto(clientId: string): EnableClientResponseDto {
    return {
      message: 'Client enabled successfully',
      clientId,
      disabled: false,
    };
  }
}
