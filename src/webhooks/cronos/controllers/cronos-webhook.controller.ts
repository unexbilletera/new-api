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
import { ColoredLogger } from '../../../shared/utils/logger-colors';

@ApiTags('webhooks')
@Controller('api/cronos')
export class CronosWebhookController {
  constructor(
    private webhookService: CronosWebhookService,
    private cronosService: CronosService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook Cronos',
    description:
      'Endpoint para receber notificações de transações PIX da Cronos',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Assinatura inválida',
  })
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
      // Log do webhook recebido
      ColoredLogger.info('[CronosWebhookController]', 'Webhook recebido', {
        id: dto.id,
        amount: dto.amount,
        customer_document: dto.customer_document,
        EndToEnd: dto.EndToEnd,
        ip: request.ip || request.socket?.remoteAddress || 'unknown',
        timestamp: new Date().toISOString(),
      });

      // 1. Validar configuração
      if (!this.cronosService.isEnabled()) {
        throw new BadRequestException('Cronos not enabled');
      }

      const webhookSecret = this.cronosService.getWebhookSecret();

      // 2. Validar assinatura se webhookSecret estiver configurado
      if (webhookSecret) {
        if (!signature) {
          ColoredLogger.warning(
            '[CronosWebhookController]',
            'Webhook secret configurado mas x-signature header ausente',
          );
          // Em produção, pode querer rejeitar. Por enquanto, apenas logar
        } else {
          // Obter raw body do request
          // No Fastify com addContentTypeParser, o rawBody está disponível em request.rawBody
          const rawBody = (request as any).rawBody;
          
          if (!rawBody) {
            ColoredLogger.warning(
              '[CronosWebhookController]',
              'Raw body não disponível para validação de assinatura',
            );
            throw new UnauthorizedException('Raw body not available for signature verification');
          }

          try {
            const isValid = verifyWebhookSignature(
              rawBody,
              signature,
              webhookSecret,
            );

            if (!isValid) {
              throw new UnauthorizedException('Invalid webhook signature');
            }

            ColoredLogger.info(
              '[CronosWebhookController]',
              'Assinatura validada com sucesso',
            );
          } catch (error) {
            if (error instanceof UnauthorizedException) {
              throw error;
            }
            ColoredLogger.errorWithStack(
              '[CronosWebhookController]',
              'Erro ao validar assinatura',
              error,
            );
            throw new UnauthorizedException('Failed to verify signature');
          }
        }
      }

      // 3. Validar dados obrigatórios
      if (!dto.id) {
        throw new BadRequestException('Missing id');
      }

      if (!dto.amount) {
        throw new BadRequestException('Missing amount');
      }

      // 4. Processar webhook
      const result = await this.webhookService.processWebhook(dto);

      return result;
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[CronosWebhookController]',
        'Erro ao processar webhook',
        error,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
}
