export class ActionResponseDto {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ListActionsResponseDto {
  data: ActionResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class CreateActionResponseDto {
  message: string;
  action: ActionResponseDto;
}

export class UpdateActionResponseDto {
  message: string;
  action: ActionResponseDto;
}

export class DeleteActionResponseDto {
  message: string;
  actionId: string;
}
