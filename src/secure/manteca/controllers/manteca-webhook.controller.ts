import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { MantecaWebhookService } from '../services/manteca-webhook.service';
import { WebhookDto } from '../dto/manteca.dto';
import { Request } from 'express';

@ApiTags('5.4 Manteca Webhooks')
@Controller('manteca')
export class MantecaWebhookController {
  constructor(private readonly webhookService: MantecaWebhookService) {}

  @Get('health')
  @ApiOperation({ summary: 'Manteca health check' })
  @ApiResponse({ status: 200, description: 'Manteca service healthy' })
  async health() {
    return {
      status: 'ok',
      service: 'manteca',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Receive Manteca webhook (public)' })
  @ApiHeader({
    name: 'x-manteca-signature',
    description: 'Webhook signature',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async webhook(
    @Body() dto: WebhookDto,
    @Headers('x-manteca-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (signature && req.rawBody) {
      const isValid = this.webhookService.verifySignature(
        req.rawBody.toString(),
        signature,
      );
      if (!isValid) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    return this.webhookService.processWebhook(dto);
  }

  @Post('check-synthetic-status')
  @ApiOperation({ summary: 'Manually check synthetic status (admin)' })
  @ApiResponse({ status: 200, description: 'Status checked' })
  async checkSyntheticStatus(@Body() body: { syntheticId: string }) {
    return {
      message: 'Manual status check not implemented',
      syntheticId: body.syntheticId,
    };
  }

  @Post('test-webhook')
  @ApiOperation({ summary: 'Test webhook endpoint (development)' })
  @ApiResponse({ status: 200, description: 'Test webhook received' })
  async testWebhook(@Body() dto: WebhookDto) {
    return this.webhookService.testWebhook(dto);
  }
}
