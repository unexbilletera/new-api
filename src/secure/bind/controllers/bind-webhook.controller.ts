import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BindOperationsService } from '../services/bind-operations.service';

@ApiTags('5.8 Bind (Argentina)')
@Controller('bind')
export class BindWebhookController {
  constructor(private readonly bindOperationsService: BindOperationsService) {}

  @Post('webhook/:method?/:action?')
  @ApiOperation({ summary: 'Receive Bind webhook (public)' })
  @ApiParam({ name: 'method', required: false, description: 'Webhook method' })
  @ApiParam({ name: 'action', required: false, description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async webhook(
    @Param('method') method: string = 'default',
    @Param('action') action: string = 'default',
    @Body() body: any,
  ) {
    return this.bindOperationsService.processWebhook(method, action, body);
  }
}
