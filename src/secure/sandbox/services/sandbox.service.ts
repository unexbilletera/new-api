import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class SandboxService {
  private readonly logger = new Logger(SandboxService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.enabled = this.configService.get<string>('SANDBOX_ENABLED') === 'true';
  }

  async cashin(data: any) {
    if (!this.enabled) {
      return { success: false, error: 'Sandbox is disabled' };
    }

    this.logger.log('Sandbox cashin', data);
    return {
      success: true,
      type: 'cashin',
      data,
      sandboxMode: true,
    };
  }

  async cashout(data: any) {
    if (!this.enabled) {
      return { success: false, error: 'Sandbox is disabled' };
    }

    this.logger.log('Sandbox cashout', data);
    return {
      success: true,
      type: 'cashout',
      data,
      sandboxMode: true,
    };
  }

  async processTransaction(data: any) {
    if (!this.enabled) {
      return { success: false, error: 'Sandbox is disabled' };
    }

    this.logger.log('Sandbox processTransaction', data);
    return {
      success: true,
      type: 'process',
      data,
      sandboxMode: true,
    };
  }

  async sendPush(data: any) {
    if (!this.enabled) {
      return { success: false, error: 'Sandbox is disabled' };
    }

    this.logger.log('Sandbox sendPush', data);
    return {
      success: true,
      type: 'push',
      data,
      sandboxMode: true,
    };
  }

  async sendMail(data: any) {
    if (!this.enabled) {
      return { success: false, error: 'Sandbox is disabled' };
    }

    this.logger.log('Sandbox sendMail', data);
    return {
      success: true,
      type: 'mail',
      data,
      sandboxMode: true,
    };
  }

  async verify(data: any) {
    if (!this.enabled) {
      return { success: false, error: 'Sandbox is disabled' };
    }

    this.logger.log('Sandbox verify', data);
    return {
      success: true,
      type: 'verify',
      data,
      sandboxMode: true,
    };
  }

  async bind(data: any) {
    if (!this.enabled) {
      return { success: false, error: 'Sandbox is disabled' };
    }

    this.logger.log('Sandbox bind', data);
    return {
      success: true,
      type: 'bind',
      data,
      sandboxMode: true,
    };
  }

  async unexWebhook(method: string, action: string, data: any) {
    if (!this.enabled) {
      return { success: false, error: 'Sandbox is disabled' };
    }

    this.logger.log(`Sandbox unex webhook: ${method}/${action}`, data);
    return {
      success: true,
      type: 'unex_webhook',
      method,
      action,
      data,
      sandboxMode: true,
    };
  }

  async micronauta(data: any) {
    if (!this.enabled) {
      return { success: false, error: 'Sandbox is disabled' };
    }

    this.logger.log('Sandbox micronauta', data);
    return {
      success: true,
      type: 'micronauta',
      data,
      sandboxMode: true,
    };
  }
}
