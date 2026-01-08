import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ description: 'Página' })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Limite por página' })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Status: pending, read' })
  @IsString()
  @IsOptional()
  status?: string;
}

export class MarkAsReadDto {
  @ApiProperty({ description: 'ID da notificação' })
  @IsString()
  notificationId: string;
}

export class UpdatePushTokenDto {
  @ApiProperty({ description: 'Token do dispositivo para push' })
  @IsString()
  pushToken: string;

  @ApiPropertyOptional({ description: 'Plataforma: ios, android' })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiPropertyOptional({ description: 'ID do device' })
  @IsString()
  @IsOptional()
  deviceId?: string;
}

export class TestPushDto {
  @ApiPropertyOptional({ description: 'Título da notificação de teste' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Mensagem da notificação de teste' })
  @IsString()
  @IsOptional()
  message?: string;
}

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  message?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  readedAt?: Date;
}
