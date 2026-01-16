import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { CronosOperationsService } from '../services/cronos-operations.service';

@ApiTags('5.5 Cronos (Brasil)')
@Controller('cronos')
export class CronosWebhookController {
  constructor(
    private readonly cronosOperationsService: CronosOperationsService,
  ) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Receive Cronos webhook (public)' })
  @ApiHeader({
    name: 'x-cronos-signature',
    description: 'Webhook signature',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async webhook(
    @Body() body: any,
    @Headers('x-cronos-signature') signature: string,
  ) {
    return this.cronosOperationsService.processWebhook(body);
  }
}
