import { Injectable } from '@nestjs/common';
import {
  ActionResponseDto,
  ListActionsResponseDto,
  CreateActionResponseDto,
  UpdateActionResponseDto,
  DeleteActionResponseDto,
} from '../dto/response';

@Injectable()
export class ActionMapper {
  toActionResponseDto(action: any): ActionResponseDto {
    return {
      id: action.id,
      name: action.name,
      description: action.description,
      endpoint: action.endpoint,
      method: action.method,
      status: action.status,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    };
  }

  toListActionsResponseDto(
    actions: any[],
    total: number,
    page: number,
    limit: number,
  ): ListActionsResponseDto {
    return {
      data: actions.map((a) => this.toActionResponseDto(a)),
      total,
      page,
      limit,
    };
  }

  toCreateActionResponseDto(action: any): CreateActionResponseDto {
    return {
      message: 'Action created successfully',
      action: this.toActionResponseDto(action),
    };
  }

  toUpdateActionResponseDto(action: any): UpdateActionResponseDto {
    return {
      message: 'Action updated successfully',
      action: this.toActionResponseDto(action),
    };
  }

  toDeleteActionResponseDto(actionId: string): DeleteActionResponseDto {
    return {
      message: 'Action deleted successfully',
      actionId,
    };
  }
}
