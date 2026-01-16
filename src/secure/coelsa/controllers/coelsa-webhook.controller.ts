import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CoelsaService } from '../services/coelsa.service';

@ApiTags('5.7 COELSA (Argentina)')
@Controller('coelsa')
export class CoelsaWebhookController {
  constructor(private readonly coelsaService: CoelsaService) {}

  @Post('webhook/:action')
  @ApiOperation({ summary: 'Receive COELSA webhook (public)' })
  @ApiParam({ name: 'action', description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async webhook(@Param('action') action: string, @Body() body: any) {
    return this.coelsaService.processWebhook(action, body);
  }
}
