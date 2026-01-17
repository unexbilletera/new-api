import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BindOperationsService } from '../services/bind-operations.service';

@ApiTags('5.8 Bind (Argentina)')
@Controller('bind')
export class BindWebhookController {
  constructor(private readonly bindOperationsService: BindOperationsService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Receive Bind webhook (no params)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async webhookBase(@Body() body: any) {
    return this.bindOperationsService.processWebhook('default', 'default', body);
  }

  @Post('webhook/:method')
  @ApiOperation({ summary: 'Receive Bind webhook (method only)' })
  @ApiParam({ name: 'method', description: 'Webhook method' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async webhookMethod(
    @Param('method') method: string,
    @Body() body: any,
  ) {
    return this.bindOperationsService.processWebhook(method, 'default', body);
  }

  @Post('webhook/:method/:action')
  @ApiOperation({ summary: 'Receive Bind webhook' })
  @ApiParam({ name: 'method', description: 'Webhook method' })
  @ApiParam({ name: 'action', description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async webhook(
    @Param('method') method: string,
    @Param('action') action: string,
    @Body() body: any,
  ) {
    return this.bindOperationsService.processWebhook(method, action, body);
  }
}
