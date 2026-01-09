import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';

export type AccessLogStatus = 'success' | 'failure';
export type DeviceType = 'Mobile' | 'Tablet' | 'Desktop';

export interface AccessLogParams {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  finalStatus: AccessLogStatus;
}

@Injectable()
export class AccessLogService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}  extractDevice(userAgent?: string): DeviceType {
    if (!userAgent) return 'Mobile';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'Mobile';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'Tablet';
    }
    return 'Desktop';
  }  extractIpAddress(ipAddress?: string): string | null {
    if (!ipAddress) return null;
    
    const parts = String(ipAddress).split(':');
    return parts.pop() || ipAddress;
  }  async log(params: AccessLogParams): Promise<void> {
    try {
      const device = this.extractDevice(params.userAgent);
      const cleanIp = this.extractIpAddress(params.ipAddress);

      await this.prisma.users_access_log.create({
        data: {
          id: randomUUID(),
          userId: params.userId,
          ipAddress: cleanIp,
          userAgent: params.userAgent || null,
          device,
          finalStatus: params.finalStatus,
        },
      });

      this.logger.debug(`Access log (${params.finalStatus}) created for user: ${params.userId}`);
    } catch (error: any) {

      this.logger.error('Failed to persist access log', error instanceof Error ? error : undefined, {
        message: error?.message,
        code: error?.code,
        userId: params.userId,
        finalStatus: params.finalStatus,
      });
    }
  }  async logSuccess(params: Omit<AccessLogParams, 'finalStatus'>): Promise<void> {
    return this.log({ ...params, finalStatus: 'success' });
  }  async logFailure(params: Omit<AccessLogParams, 'finalStatus'>): Promise<void> {
    return this.log({ ...params, finalStatus: 'failure' });
  }
}
