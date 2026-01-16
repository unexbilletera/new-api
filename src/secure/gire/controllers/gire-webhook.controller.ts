import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GireService } from '../services/gire.service';

@ApiTags('5.6 GIRE (Argentina)')
@Controller('gire')
export class GireWebhookController {
  constructor(private readonly gireService: GireService) {}

  @Post('webhook/:method?/:action?')
  @ApiOperation({ summary: 'Receive GIRE webhook (public)' })
  @ApiParam({ name: 'method', required: false, description: 'Webhook method' })
  @ApiParam({ name: 'action', required: false, description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async webhook(
    @Param('method') method: string = 'default',
    @Param('action') action: string = 'default',
    @Body() body: any,
  ) {
    return this.gireService.processWebhook(method, action, body);
  }
}
