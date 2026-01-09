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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from '../services/notifications.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
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

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List notifications',
    description: 'Returns the list of notifications for the authenticated user with pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records per page (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications listed successfully',
    type: ListNotificationsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async list(
    @CurrentUser('id') userId: string,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<ListNotificationsResponseDto> {
    return this.notificationsService.list(userId, query);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Marks a specific notification as read',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Notification ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: MarkAsReadResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ): Promise<MarkAsReadResponseDto> {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Marks all notifications of the user as read',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
    type: MarkAllAsReadResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async markAllAsRead(@CurrentUser('id') userId: string): Promise<MarkAllAsReadResponseDto> {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Removes a specific notification',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Notification ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
    type: DeleteNotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ): Promise<DeleteNotificationResponseDto> {
    return this.notificationsService.delete(userId, notificationId);
  }

  @Post('push-token')
  @ApiOperation({
    summary: 'Update push token',
    description: 'Updates the push notification token of the user device',
  })
  @ApiResponse({
    status: 201,
    description: 'Push token updated successfully',
    type: UpdatePushTokenResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async updatePushToken(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePushTokenDto,
  ): Promise<UpdatePushTokenResponseDto> {
    return this.notificationsService.updatePushToken(userId, dto);
  }

  @Get('push-token')
  @ApiOperation({
    summary: 'Get push token',
    description: 'Returns the push notification token stored for the device',
  })
  @ApiResponse({
    status: 200,
    description: 'Push token retrieved successfully',
    type: GetPushTokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async getPushToken(@CurrentUser('id') userId: string): Promise<GetPushTokenResponseDto> {
    return this.notificationsService.getPushToken(userId);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send test notification',
    description: 'Sends a test push notification to the user device',
  })
  @ApiResponse({
    status: 200,
    description: 'Test notification sent successfully',
    type: SendTestPushResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async sendTestPush(
    @CurrentUser('id') userId: string,
    @Body() dto: TestPushDto,
  ): Promise<SendTestPushResponseDto> {
    return this.notificationsService.sendTestPush(userId, dto);
  }
}
