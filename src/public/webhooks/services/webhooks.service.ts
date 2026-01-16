import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async processBindWebhook(method: string, action: string, payload: any) {
    this.logger.log(`Processing Bind webhook: ${method}/${action}`, payload);

    if (
      !this.configService.get<string>('BIND_ENABLED') ||
      this.configService.get<string>('BIND_ENABLED') !== 'true'
    ) {
      return { success: false, error: 'Bind is disabled' };
    }

    return { success: true, type: 'bind', method, action, processed: true };
  }

  async processGireWebhook(method: string, action: string, payload: any) {
    this.logger.log(`Processing GIRE webhook: ${method}/${action}`, payload);

    if (
      !this.configService.get<string>('GIRE_ENABLED') ||
      this.configService.get<string>('GIRE_ENABLED') !== 'true'
    ) {
      return { success: false, error: 'GIRE is disabled' };
    }

    return { success: true, type: 'gire', method, action, processed: true };
  }

  async processUnexWebhook(method: string, action: string, payload: any) {
    this.logger.log(`Processing Unex webhook: ${method}/${action}`, payload);

    if (
      !this.configService.get<string>('UNEX_ENABLED') ||
      this.configService.get<string>('UNEX_ENABLED') !== 'true'
    ) {
      return { success: false, error: 'Unex is disabled' };
    }

    return { success: true, type: 'unex', method, action, processed: true };
  }

  async processMantecaWebhook(method: string, action: string, payload: any) {
    this.logger.log(`Processing Manteca webhook: ${method}/${action}`, payload);

    if (
      !this.configService.get<string>('MANTECA_ENABLED') ||
      this.configService.get<string>('MANTECA_ENABLED') !== 'true'
    ) {
      return { success: false, error: 'Manteca is disabled' };
    }

    return { success: true, type: 'manteca', method, action, processed: true };
  }

  async getBindWebhookStatus() {
    return { success: true, type: 'bind', status: 'active' };
  }
}
