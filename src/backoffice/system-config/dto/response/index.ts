export class SystemConfigResponseDto {
  key: string;
  value: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ListSystemConfigResponseDto {
  data: SystemConfigResponseDto[];
  total: number;
}

export class UpdateSystemConfigResponseDto {
  message: string;
  config: SystemConfigResponseDto;
}

export class GetSystemConfigResponseDto {
  config: SystemConfigResponseDto;
}
