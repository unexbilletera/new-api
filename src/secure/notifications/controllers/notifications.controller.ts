import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { AuthGuard } from '../../../shared/guards/auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import {
  ListNotificationsQueryDto,
  UpdatePushTokenDto,
  TestPushDto,
} from '../dto/notifications.dto';
import {
  ListNotificationsResponseDto,
  MarkAsReadResponseDto,
  MarkAllAsReadResponseDto,
  DeleteNotificationResponseDto,
  UpdatePushTokenResponseDto,
  GetPushTokenResponseDto,
  SendTestPushResponseDto,
} from '../dto/response';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser('id') userId: string,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<ListNotificationsResponseDto> {
    return this.notificationsService.list(userId, query);
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ): Promise<MarkAsReadResponseDto> {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser('id') userId: string): Promise<MarkAllAsReadResponseDto> {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ): Promise<DeleteNotificationResponseDto> {
    return this.notificationsService.delete(userId, notificationId);
  }

  @Post('push-token')
  async updatePushToken(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePushTokenDto,
  ): Promise<UpdatePushTokenResponseDto> {
    return this.notificationsService.updatePushToken(userId, dto);
  }

  @Get('push-token')
  async getPushToken(@CurrentUser('id') userId: string): Promise<GetPushTokenResponseDto> {
    return this.notificationsService.getPushToken(userId);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async sendTestPush(
    @CurrentUser('id') userId: string,
    @Body() dto: TestPushDto,
  ): Promise<SendTestPushResponseDto> {
    return this.notificationsService.sendTestPush(userId, dto);
  }
}
