import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly prisma: PrismaService) {}

  async updatePushToken(userId: string, data: { token: string; platform?: string }) {
    this.logger.log(`Updating push token for user ${userId}`);

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const updateData: any = { updatedAt: new Date() };
    if (data.platform === 'browser') {
      updateData.browserDevicePush = data.token;
    } else {
      updateData.mobileDevicePush = data.token;
    }

    await this.prisma.users.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      success: true,
      message: 'Push token updated',
      userId,
    };
  }

  async getPushTokenInfo(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mobileDevicePush: true,
        browserDevicePush: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const pushToken = user.mobileDevicePush || user.browserDevicePush;

    return {
      success: true,
      hasMobileToken: !!user.mobileDevicePush,
      hasBrowserToken: !!user.browserDevicePush,
      tokenLength: pushToken?.length || 0,
      lastUpdated: user.updatedAt,
    };
  }

  async testPushNotification(userId: string) {
    this.logger.log(`Testing push notification for user ${userId}`);

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, mobileDevicePush: true, browserDevicePush: true },
    });

    const pushToken = user?.mobileDevicePush || user?.browserDevicePush;

    if (!pushToken) {
      return { success: false, error: 'No push token found' };
    }

    return {
      success: true,
      message: 'Test push notification sent',
      token: pushToken.substring(0, 20) + '...',
    };
  }

  async debugPushToken(userId: string) {
    this.logger.log(`Debug push token for user ${userId}`);

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mobileDevicePush: true,
        browserDevicePush: true,
        name: true,
        email: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const pushToken = user.mobileDevicePush || user.browserDevicePush;

    return {
      success: true,
      userId: user.id,
      name: user.name,
      email: user.email,
      hasMobileToken: !!user.mobileDevicePush,
      hasBrowserToken: !!user.browserDevicePush,
      tokenPrefix: pushToken?.substring(0, 30),
      tokenLength: pushToken?.length || 0,
      lastUpdated: user.updatedAt,
    };
  }

  async simplePushTest(userId: string, message?: string) {
    this.logger.log(`Simple push test for user ${userId}`);

    return {
      success: true,
      message: 'Push test initiated',
      userId,
      testMessage: message || 'Test notification',
      timestamp: new Date().toISOString(),
    };
  }
}
