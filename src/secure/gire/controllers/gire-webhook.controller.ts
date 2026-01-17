import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GireService } from '../services/gire.service';

@ApiTags('5.6 GIRE (Argentina)')
@Controller('gire')
export class GireWebhookController {
  constructor(private readonly gireService: GireService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Receive GIRE webhook (no params)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async webhookBase(@Body() body: any) {
    return this.gireService.processWebhook('default', 'default', body);
  }

  @Post('webhook/:method')
  @ApiOperation({ summary: 'Receive GIRE webhook (method only)' })
  @ApiParam({ name: 'method', description: 'Webhook method' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async webhookMethod(
    @Param('method') method: string,
    @Body() body: any,
  ) {
    return this.gireService.processWebhook(method, 'default', body);
  }

  @Post('webhook/:method/:action')
  @ApiOperation({ summary: 'Receive GIRE webhook' })
  @ApiParam({ name: 'method', description: 'Webhook method' })
  @ApiParam({ name: 'action', description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async webhook(
    @Param('method') method: string,
    @Param('action') action: string,
    @Body() body: any,
  ) {
    return this.gireService.processWebhook(method, action, body);
  }
}
