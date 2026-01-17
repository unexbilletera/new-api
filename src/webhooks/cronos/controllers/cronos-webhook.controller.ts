import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CronosWebhookService } from '../services/cronos-webhook.service';
import { CronosWebhookDto } from '../dto/cronos-webhook.dto';
import { CronosService } from '../../../shared/cronos/cronos.service';
import { verifyWebhookSignature } from '../../../shared/utils/webhook-signature.validator';
import { LoggerService } from '../../../shared/logger/logger.service';

@ApiTags('Webhooks')
@Controller('api/cronos')
export class CronosWebhookController {
  constructor(
    private webhookService: CronosWebhookService,
    private cronosService: CronosService,
    private logger: LoggerService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cronos Webhook',
    description: 'Endpoint to receive PIX and billet transaction notifications from Cronos',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async webhook(
    @Body() dto: CronosWebhookDto,
    @Headers('x-signature') signature: string,
    @Req() request: FastifyRequest,
  ): Promise<{
    success: boolean;
    message: string;
    transactionId?: string;
  }> {
    try {
      this.logger.info('[CronosWebhookController]', 'Webhook received', {
        id: dto.id,
        type: dto.type,
        amount: dto.amount,
        status: dto.status,
        ip: request.ip || 'unknown',
        timestamp: new Date().toISOString(),
      });

      if (!this.cronosService.isEnabled()) {
        throw new BadRequestException('Cronos not enabled');
      }

      const webhookSecret = this.cronosService.getWebhookSecret();

      if (webhookSecret) {
        if (!signature) {
          this.logger.warn(
            '[CronosWebhookController] WARNING',
            'Webhook secret configured but x-signature header missing',
          );
        } else {
          const rawBody = JSON.stringify(dto);
          const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

          if (!isValid) {
            this.logger.error(
              '[CronosWebhookController] ERROR',
              'Invalid webhook signature',
            );
            throw new UnauthorizedException('Invalid webhook signature');
          }

          this.logger.info(
            '[CronosWebhookController]',
            'Webhook signature verified successfully',
          );
        }
      }

      const webhookType = this.determineWebhookType(dto);

      switch (webhookType) {
        case 'pix_cashin':
          return await this.webhookService.processPixCashin(dto);
        case 'pix_cashout':
          return await this.webhookService.processPixCashout(dto);
        case 'billet':
          return await this.webhookService.processBilletPayment(dto);
        default:
          this.logger.warn(
            '[CronosWebhookController] WARNING',
            `Unknown webhook type: ${dto.type}`,
          );
          return {
            success: true,
            message: 'Webhook received but not processed',
          };
      }
    } catch (error) {
      this.logger.errorWithStack(
        '[CronosWebhookController] CRITICAL',
        'Failed to process webhook',
        error,
      );
      throw error;
    }
  }

  private determineWebhookType(
    dto: CronosWebhookDto,
  ): 'pix_cashin' | 'pix_cashout' | 'billet' | 'unknown' {
    const type = dto.type?.toLowerCase() || '';

    if (type.includes('cashin') || type.includes('received') || type.includes('entrada')) {
      return 'pix_cashin';
    }

    if (type.includes('cashout') || type.includes('sent') || type.includes('saida')) {
      return 'pix_cashout';
    }

    if (type.includes('boleto') || type.includes('billet')) {
      return 'billet';
    }

    if (dto.EndToEnd && dto.payer_document) {
      return 'pix_cashin';
    }

    return 'unknown';
  }
}
