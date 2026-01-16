import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ValidaService {
  private readonly logger = new Logger(ValidaService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly enabled: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.baseUrl = this.configService.get<string>('VALIDA_URL') || '';
    this.apiKey = this.configService.get<string>('VALIDA_API_KEY') || '';
    this.enabled = this.configService.get<string>('VALIDA_ENABLED') === 'true';
  }

  async getEnrollmentInfo(refId: string) {
    if (!this.enabled) {
      return { success: false, error: 'Valida is disabled' };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/enrollment/${refId}`, {
          headers: { 'x-api-key': this.apiKey },
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('getEnrollmentInfo failed', error.message);
      throw error;
    }
  }

  async cancelEnrollment(refId: string) {
    if (!this.enabled) {
      return { success: false, error: 'Valida is disabled' };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/enrollment/${refId}`, {
          headers: { 'x-api-key': this.apiKey },
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('cancelEnrollment failed', error.message);
      throw error;
    }
  }

  async processWebhook(payload: any) {
    this.logger.log('Processing Valida webhook', payload);

    try {
      const { event, data } = payload;

      switch (event) {
        case 'enrollment_completed':
        case 'enrollment_failed':
        case 'enrollment_cancelled':
          return this.handleEnrollmentWebhook(event, data);
        default:
          this.logger.warn(`Unknown webhook event: ${event}`);
          return { success: false, error: `Unknown event: ${event}` };
      }
    } catch (error: any) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      throw error;
    }
  }

  async handleRedirection(action: string) {
    this.logger.log(`Valida redirection: ${action}`);
    return { success: true, action, redirected: true };
  }

  private async handleEnrollmentWebhook(event: string, data: any) {
    this.logger.log(`Enrollment webhook: ${event}`, data);
    return { success: true, event, processed: true };
  }
}
