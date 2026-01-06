import { Injectable } from '@nestjs/common';
import {
  SystemConfigResponseDto,
  ListSystemConfigResponseDto,
  UpdateSystemConfigResponseDto,
  GetSystemConfigResponseDto,
} from '../dto/response';

@Injectable()
export class SystemConfigMapper {
  toSystemConfigResponseDto(config: any): SystemConfigResponseDto {
    return {
      key: config.key,
      value: config.value,
      description: config.description,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  toListSystemConfigResponseDto(configs: any[]): ListSystemConfigResponseDto {
    return {
      data: configs.map((c) => this.toSystemConfigResponseDto(c)),
      total: configs.length,
    };
  }

  toUpdateSystemConfigResponseDto(config: any): UpdateSystemConfigResponseDto {
    return {
      message: 'Config updated successfully',
      config: this.toSystemConfigResponseDto(config),
    };
  }

  toGetSystemConfigResponseDto(config: any): GetSystemConfigResponseDto {
    return {
      config: this.toSystemConfigResponseDto(config),
    };
  }
}
