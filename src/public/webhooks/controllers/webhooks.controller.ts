import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { WebhooksService } from '../services/webhooks.service';

@ApiTags('22. Webhooks')
@Controller('webhook')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('bind')
  @ApiOperation({ summary: 'Process Bind webhook (no params)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async bindWebhookBase(@Body() body: any) {
    return this.webhooksService.processBindWebhook('', '', body);
  }

  @Post('bind/:method')
  @ApiOperation({ summary: 'Process Bind webhook (method only)' })
  @ApiParam({ name: 'method', description: 'Webhook method' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async bindWebhookMethod(
    @Param('method') method: string,
    @Body() body: any,
  ) {
    return this.webhooksService.processBindWebhook(method, '', body);
  }

  @Post('bind/:method/:action')
  @ApiOperation({ summary: 'Process Bind webhook' })
  @ApiParam({ name: 'method', description: 'Webhook method' })
  @ApiParam({ name: 'action', description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async bindWebhook(
    @Param('method') method: string,
    @Param('action') action: string,
    @Body() body: any,
  ) {
    return this.webhooksService.processBindWebhook(method, action, body);
  }

  @Get('bind')
  @ApiOperation({ summary: 'Bind webhook status (no params)' })
  @ApiResponse({ status: 200, description: 'Status' })
  async bindWebhookStatusBase() {
    return this.webhooksService.getBindWebhookStatus();
  }

  @Get('bind/:method')
  @ApiOperation({ summary: 'Bind webhook status (method only)' })
  @ApiParam({ name: 'method', description: 'Webhook method' })
  @ApiResponse({ status: 200, description: 'Status' })
  async bindWebhookStatusMethod() {
    return this.webhooksService.getBindWebhookStatus();
  }

  @Get('bind/:method/:action')
  @ApiOperation({ summary: 'Bind webhook status' })
  @ApiParam({ name: 'method', description: 'Webhook method' })
  @ApiParam({ name: 'action', description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Status' })
  async bindWebhookStatus() {
    return this.webhooksService.getBindWebhookStatus();
  }

  @Post('gire')
  @ApiOperation({ summary: 'Process GIRE webhook (no params)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async gireWebhookBase(@Body() body: any) {
    return this.webhooksService.processGireWebhook('', '', body);
  }

  @Post('gire/:method')
  @ApiOperation({ summary: 'Process GIRE webhook (method only)' })
  @ApiParam({ name: 'method', description: 'Webhook method' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async gireWebhookMethod(
    @Param('method') method: string,
    @Body() body: any,
  ) {
    return this.webhooksService.processGireWebhook(method, '', body);
  }

  @Post('gire/:method/:action')
  @ApiOperation({ summary: 'Process GIRE webhook' })
  @ApiParam({ name: 'method', description: 'Webhook method' })
  @ApiParam({ name: 'action', description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async gireWebhook(
    @Param('method') method: string,
    @Param('action') action: string,
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

  @Post('manteca/:method')
  @ApiOperation({ summary: 'Process Manteca webhook (method only)' })
  @ApiParam({ name: 'method', description: 'Webhook method' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async mantecaWebhookMethod(
    @Param('method') method: string,
    @Body() body: any,
  ) {
    return this.webhooksService.processMantecaWebhook(method, '', body);
  }

  @Post('manteca/:method/:action')
  @ApiOperation({ summary: 'Process Manteca webhook' })
  @ApiParam({ name: 'method', description: 'Webhook method' })
  @ApiParam({ name: 'action', description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async mantecaWebhook(
    @Param('method') method: string,
    @Param('action') action: string,
    @Body() body: any,
  ) {
    return this.webhooksService.processMantecaWebhook(method, action, body);
  }
}
