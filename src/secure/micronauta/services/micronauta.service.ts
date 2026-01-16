import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MicronautaService {
  private readonly logger = new Logger(MicronautaService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly enabled: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.baseUrl = this.configService.get<string>('MICRONAUTA_URL') || '';
    this.apiKey = this.configService.get<string>('MICRONAUTA_API_KEY') || '';
    this.enabled =
      this.configService.get<string>('MICRONAUTA_ENABLED') === 'true';
  }

  async getCards(userId: string, cuit: string) {
    if (!this.enabled) {
      return { success: false, error: 'Micronauta is disabled' };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/cards/${userId}/${cuit}`, {
          headers: { 'x-api-key': this.apiKey },
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('getCards failed', error.message);
      throw error;
    }
  }

  async getCard(id: string) {
    if (!this.enabled) {
      return { success: false, error: 'Micronauta is disabled' };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/cards/${id}`, {
          headers: { 'x-api-key': this.apiKey },
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('getCard failed', error.message);
      throw error;
    }
  }

  async syncCards(cuit: string) {
    if (!this.enabled) {
      return { success: false, error: 'Micronauta is disabled' };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/syncCards/${cuit}`, {
          headers: { 'x-api-key': this.apiKey },
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('syncCards failed', error.message);
      throw error;
    }
  }

  async processWebhook(action: string, payload: any) {
    this.logger.log(`Processing Micronauta webhook: ${action}`);

    try {
      switch (action) {
        case 'card_created':
        case 'card_updated':
        case 'card_deleted':
          return this.handleCardWebhook(action, payload);
        default:
          this.logger.warn(`Unknown webhook action: ${action}`);
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (error: any) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      throw error;
    }
  }

  private async handleCardWebhook(action: string, payload: any) {
    this.logger.log(`Card webhook: ${action}`, payload);
    return { success: true, action, processed: true };
  }
}
