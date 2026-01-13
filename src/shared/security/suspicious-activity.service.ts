import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';

interface SuspiciousActivityCheck {
  isSuspicious: boolean;
  reasons: string[];
  riskScore: number;
}

interface DeviceFingerprint {
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
  browserFingerprint?: string;
  platform?: string;
}

@Injectable()
export class SuspiciousActivityService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async checkLoginActivity(
    userId: string,
    currentFingerprint: DeviceFingerprint,
    previousFingerprint?: DeviceFingerprint,
  ): Promise<SuspiciousActivityCheck> {
    const reasons: string[] = [];
    let riskScore = 0;

    if (
      previousFingerprint?.deviceId &&
      currentFingerprint.deviceId !== previousFingerprint.deviceId
    ) {
      reasons.push('New device detected');
      riskScore += 15;
    }

    if (previousFingerprint?.ipAddress && currentFingerprint.ipAddress) {
      const ipChanged = await this.checkIPChange(
        previousFingerprint.ipAddress,
        currentFingerprint.ipAddress,
      );

      if (ipChanged.riskLevel === 'high') {
        reasons.push(`High-risk IP change: ${ipChanged.reason}`);
        riskScore += 30;
      } else if (ipChanged.riskLevel === 'medium') {
        reasons.push(`Medium-risk IP change: ${ipChanged.reason}`);
        riskScore += 15;
      }
    }

    if (
      previousFingerprint?.userAgent &&
      currentFingerprint.userAgent &&
      previousFingerprint.userAgent !== currentFingerprint.userAgent
    ) {
      reasons.push('User agent changed');
      riskScore += 10;
    }

    if (previousFingerprint?.ipAddress && currentFingerprint.ipAddress) {
      const impossibleTravel = await this.checkImpossibleTravel(
        previousFingerprint.ipAddress,
        currentFingerprint.ipAddress,
        userId,
      );

      if (impossibleTravel) {
        reasons.push('Impossible travel detected');
        riskScore += 40;
      }
    }

    if (currentFingerprint.ipAddress) {
      const isMalicious = await this.checkMaliciousIP(
        currentFingerprint.ipAddress,
      );
      if (isMalicious) {
        reasons.push('Known malicious IP address');
        riskScore += 50;
      }
    }

    const recentLogins = await this.getRecentLoginCount(userId, 60 * 60 * 1000);
    if (recentLogins > 10) {
      reasons.push(`Excessive login attempts: ${recentLogins} in last hour`);
      riskScore += 20;
    }

    const isSuspicious = riskScore >= 30;

    if (isSuspicious) {
      this.logger.warn('Suspicious login activity detected', {
        userId,
        riskScore,
        reasons,
        fingerprint: currentFingerprint,
      });
    }

    return {
      isSuspicious,
      reasons,
      riskScore: Math.min(100, riskScore),
    };
  }

  private async checkIPChange(
    previousIP: string,
    currentIP: string,
  ): Promise<{ riskLevel: 'low' | 'medium' | 'high'; reason: string }> {
    const previousSubnet = previousIP.split('.').slice(0, 3).join('.');
    const currentSubnet = currentIP.split('.').slice(0, 3).join('.');

    if (previousSubnet === currentSubnet) {
      return { riskLevel: 'low', reason: 'Same subnet' };
    }

    return { riskLevel: 'medium', reason: 'Different subnet' };
  }

  private async checkImpossibleTravel(
    previousIP: string,
    currentIP: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const lastLogin = await this.prisma.users_access_log.findFirst({
        where: {
          userId,
          finalStatus: 'success',
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          createdAt: true,
          ipAddress: true,
        },
      });

      if (!lastLogin || lastLogin.ipAddress === currentIP) {
        return false;
      }

      const timeSinceLastLogin = Date.now() - lastLogin.createdAt.getTime();
      const oneHour = 60 * 60 * 1000;

      if (timeSinceLastLogin < oneHour) {
        const lastSubnet = lastLogin.ipAddress
          ?.split('.')
          .slice(0, 2)
          .join('.');
        const currentSubnet = currentIP.split('.').slice(0, 2).join('.');

        if (lastSubnet !== currentSubnet) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(
        'Error checking impossible travel',
        error instanceof Error ? error : undefined,
      );
      return false;
    }
  }

  private async checkMaliciousIP(ipAddress: string): Promise<boolean> {
    const suspiciousRanges = [];

    return suspiciousRanges.some((range) => ipAddress.startsWith(range));
  }

  private async getRecentLoginCount(
    userId: string,
    windowMs: number,
  ): Promise<number> {
    try {
      const windowStart = new Date(Date.now() - windowMs);

      return await this.prisma.users_access_log.count({
        where: {
          userId,
          finalStatus: 'success',
          createdAt: {
            gte: windowStart,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        'Error getting recent login count',
        error instanceof Error ? error : undefined,
      );
      return 0;
    }
  }

  static extractFingerprint(
    userAgent?: string,
    ipAddress?: string,
    deviceId?: string,
  ): DeviceFingerprint {
    return {
      deviceId,
      userAgent,
      ipAddress,
      platform: userAgent ? this.extractPlatform(userAgent) : undefined,
    };
  }

  private static extractPlatform(userAgent: string): string {
    const ua = userAgent.toLowerCase();

    if (
      ua.includes('mobile') ||
      ua.includes('android') ||
      ua.includes('iphone')
    ) {
      return 'mobile';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    }
    return 'desktop';
  }
}
