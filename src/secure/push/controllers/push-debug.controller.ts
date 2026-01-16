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

@ApiTags('20.1 Push Debug')
@ApiBearerAuth('JWT-auth')
@Controller('push-debug')
@UseGuards(JwtAuthGuard)
export class PushDebugController {
  constructor(private readonly pushService: PushService) {}

  @Get('debug')
  @ApiOperation({ summary: 'Debug push token status' })
  @ApiResponse({ status: 200, description: 'Debug info' })
  async debugPushToken(@Request() req: any) {
    return this.pushService.debugPushToken(req.user?.userId);
  }

  @Post('test')
  @ApiOperation({ summary: 'Simple push test' })
  @ApiResponse({ status: 200, description: 'Test result' })
  async simplePushTest(
    @Body() body: { message?: string },
    @Request() req: any,
  ) {
    return this.pushService.simplePushTest(req.user?.userId, body.message);
  }
}
