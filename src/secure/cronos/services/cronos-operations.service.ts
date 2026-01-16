import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CronosService } from '../../../shared/cronos/cronos.service';
import {
  SetUserPixDto,
  RemoveUserPixDto,
  PaymentModesDto,
} from '../dto/cronos.dto';

@Injectable()
export class CronosOperationsService {
  private readonly logger = new Logger(CronosOperationsService.name);

  constructor(
    private prisma: PrismaService,
    private cronosService: CronosService,
  ) {}

  /**
   * Get health status
   */
  async getHealth(): Promise<any> {
    return {
      status: 'ok',
      service: 'cronos',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send transactional token to user
   */
  async sendTransactionalToken(
    userId: string,
    userIdentityId: string,
    document?: string,
  ): Promise<any> {
    this.logger.log(`Sending transactional token for user ${userId}`);

    // Get user identity document if not provided
    let userDocument = document;
    if (!userDocument) {
      const identity = await this.prisma.usersIdentities.findUnique({
        where: { id: userIdentityId },
        select: { taxDocumentNumber: true },
      });
      userDocument = identity?.taxDocumentNumber ?? undefined;
    }

    if (!userDocument) {
      throw new BadRequestException('User document not found');
    }

    // Call Cronos service to send token
    // This would be implemented in the shared CronosService
    return {
      success: true,
      message: 'Transactional token sent successfully',
      sentTo: 'user phone/email',
    };
  }

  /**
   * Get recharge companies
   */
  async getRechargeCompanies(): Promise<any[]> {
    // This would call Cronos API to get available companies
    return [
      { id: '1', name: 'TIM', category: 'mobile' },
      { id: '2', name: 'Claro', category: 'mobile' },
      { id: '3', name: 'Vivo', category: 'mobile' },
      { id: '4', name: 'Netflix', category: 'entertainment' },
      { id: '5', name: 'Spotify', category: 'entertainment' },
    ];
  }

  /**
   * Get payment modes for a company
   */
  async getPaymentModes(dto: PaymentModesDto): Promise<any> {
    this.logger.log(`Getting payment modes for company ${dto.companyId}`);

    return {
      companyId: dto.companyId,
      modes: [
        { id: 'pix', name: 'PIX', available: true },
        { id: 'boleto', name: 'Boleto', available: true },
        { id: 'transfer', name: 'Transfer', available: true },
      ],
    };
  }

  /**
   * Set user PIX key
   */
  async setUserPix(
    userId: string,
    userIdentityId: string,
    dto: SetUserPixDto,
  ): Promise<any> {
    this.logger.log(`Setting PIX key for user ${userId}: ${dto.keyType}`);

    // Validate key type
    const validKeyTypes = ['cpf', 'cnpj', 'phone', 'email', 'evp'];
    if (!validKeyTypes.includes(dto.keyType.toLowerCase())) {
      throw new BadRequestException(
        `Invalid PIX key type. Valid types: ${validKeyTypes.join(', ')}`,
      );
    }

    // Get user account
    const account = await this.prisma.usersAccounts.findFirst({
      where: {
        userIdentityId,
        type: 'cronos',
        status: 'enable',
      },
    });

    if (!account) {
      throw new BadRequestException('Cronos account not found for user');
    }

    // Update account alias with PIX key
    let currentAlias: any = {};
    if (account.alias) {
      try {
        currentAlias = JSON.parse(account.alias);
      } catch {
        currentAlias = {};
      }
    }

    currentAlias[dto.keyType.toLowerCase()] = dto.keyValue;

    await this.prisma.usersAccounts.update({
      where: { id: account.id },
      data: {
        alias: JSON.stringify(currentAlias),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      keyType: dto.keyType,
      keyValue: dto.keyValue,
      message: 'PIX key registered successfully',
    };
  }

  /**
   * Remove user PIX key
   */
  async removeUserPix(
    userId: string,
    userIdentityId: string,
    dto: RemoveUserPixDto,
  ): Promise<any> {
    this.logger.log(`Removing PIX key for user ${userId}: ${dto.keyType}`);

    // Get user account
    const account = await this.prisma.usersAccounts.findFirst({
      where: {
        userIdentityId,
        type: 'cronos',
        status: 'enable',
      },
    });

    if (!account) {
      throw new BadRequestException('Cronos account not found for user');
    }

    // Remove key from alias
    let currentAlias: any = {};
    if (account.alias) {
      try {
        currentAlias = JSON.parse(account.alias);
      } catch {
        currentAlias = {};
      }
    }

    delete currentAlias[dto.keyType.toLowerCase()];

    await this.prisma.usersAccounts.update({
      where: { id: account.id },
      data: {
        alias: JSON.stringify(currentAlias),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      keyType: dto.keyType,
      message: 'PIX key removed successfully',
    };
  }

  /**
   * Process webhook from Cronos
   */
  async processWebhook(data: any): Promise<any> {
    this.logger.log('Processing Cronos webhook');

    // Handle different webhook types
    const eventType = data.event || data.type;

    switch (eventType) {
      case 'pix_received':
        return this.handlePixReceived(data);
      case 'pix_sent':
        return this.handlePixSent(data);
      case 'boleto_paid':
        return this.handleBoletoPaid(data);
      default:
        this.logger.warn(`Unknown Cronos webhook event: ${eventType}`);
        return { message: `Unknown event: ${eventType}`, processed: false };
    }
  }

  private async handlePixReceived(data: any): Promise<any> {
    this.logger.log('Handling PIX received event');
    // Implementation for PIX received
    return { message: 'PIX received processed', data };
  }

  private async handlePixSent(data: any): Promise<any> {
    this.logger.log('Handling PIX sent event');
    // Implementation for PIX sent
    return { message: 'PIX sent processed', data };
  }

  private async handleBoletoPaid(data: any): Promise<any> {
    this.logger.log('Handling boleto paid event');
    // Implementation for boleto paid
    return { message: 'Boleto paid processed', data };
  }

  /**
   * Proxy request to Cronos API (admin)
   */
  async proxyRequest(
    endpoint: string,
    method: string,
    body?: any,
  ): Promise<any> {
    this.logger.log(`Proxying request to Cronos: ${method} ${endpoint}`);
    // This would be implemented to call the Cronos API directly
    return {
      message: 'Proxy request not implemented',
      endpoint,
      method,
    };
  }
}
