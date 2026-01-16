import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ description: 'Page' })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Limit per page' })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Status: pending, read' })
  @IsString()
  @IsOptional()
  status?: string;
}

export class MarkAsReadDto {
  @ApiProperty({ description: 'Notification ID' })
  @IsString()
  notificationId: string;
}

export class UpdatePushTokenDto {
  @ApiProperty({ description: 'Device token for push' })
  @IsString()
  pushToken: string;

  @ApiPropertyOptional({ description: 'Platform: ios, android' })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiPropertyOptional({ description: 'Device ID' })
  @IsString()
  @IsOptional()
  deviceId?: string;
}

export class TestPushDto {
  @ApiPropertyOptional({ description: 'Test notification title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Test notification message' })
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
