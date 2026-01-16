import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { PushService } from '../services/push.service';

@ApiTags('20. Push Token')
@ApiBearerAuth('JWT-auth')
@Controller('push-token')
@UseGuards(JwtAuthGuard)
export class PushTokenController {
  constructor(private readonly pushService: PushService) {}

  @Post()
  @ApiOperation({ summary: 'Update user push token' })
  @ApiResponse({ status: 200, description: 'Push token updated' })
  async updatePushToken(
    @Body() body: { token: string; platform?: string },
    @Request() req: any,
  ) {
    return this.pushService.updatePushToken(req.user?.userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get user push token info' })
  @ApiResponse({ status: 200, description: 'Push token info' })
  async getPushTokenInfo(@Request() req: any) {
    return this.pushService.getPushTokenInfo(req.user?.userId);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test push notification' })
  @ApiResponse({ status: 200, description: 'Test result' })
  async testPushNotification(@Request() req: any) {
    return this.pushService.testPushNotification(req.user?.userId);
  }
}
