import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { WebhooksService } from '../services/webhooks.service';

@ApiTags('22. Webhooks')
@Controller('webhook')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('bind/:method?/:action?')
  @ApiOperation({ summary: 'Process Bind webhook' })
  @ApiParam({ name: 'method', required: false, description: 'Webhook method' })
  @ApiParam({ name: 'action', required: false, description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async bindWebhook(
    @Param('method') method: string = '',
    @Param('action') action: string = '',
    @Body() body: any,
  ) {
    return this.webhooksService.processBindWebhook(method, action, body);
  }

  @Get('bind/:method?/:action?')
  @ApiOperation({ summary: 'Bind webhook status' })
  @ApiParam({ name: 'method', required: false, description: 'Webhook method' })
  @ApiParam({ name: 'action', required: false, description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Status' })
  async bindWebhookStatus() {
    return this.webhooksService.getBindWebhookStatus();
  }

  @Post('gire/:method?/:action?')
  @ApiOperation({ summary: 'Process GIRE webhook' })
  @ApiParam({ name: 'method', required: false, description: 'Webhook method' })
  @ApiParam({ name: 'action', required: false, description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async gireWebhook(
    @Param('method') method: string = '',
    @Param('action') action: string = '',
    @Body() body: any,
  ) {
    return this.webhooksService.processGireWebhook(method, action, body);
  }

  @Post('unex/:method/:action')
  @ApiOperation({ summary: 'Process Unex webhook' })
  @ApiParam({ name: 'method', description: 'Webhook method' })
  @ApiParam({ name: 'action', description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async unexWebhook(
    @Param('method') method: string,
    @Param('action') action: string,
    @Body() body: any,
  ) {
    return this.webhooksService.processUnexWebhook(method, action, body);
  }

  @Post('manteca')
  @ApiOperation({ summary: 'Process Manteca webhook (no params)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async mantecaWebhookBase(@Body() body: any) {
    return this.webhooksService.processMantecaWebhook('', '', body);
  }

  @Post('manteca/:method?/:action?')
  @ApiOperation({ summary: 'Process Manteca webhook' })
  @ApiParam({ name: 'method', required: false, description: 'Webhook method' })
  @ApiParam({ name: 'action', required: false, description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async mantecaWebhook(
    @Param('method') method: string = '',
    @Param('action') action: string = '',
    @Body() body: any,
  ) {
    return this.webhooksService.processMantecaWebhook(method, action, body);
  }
}
