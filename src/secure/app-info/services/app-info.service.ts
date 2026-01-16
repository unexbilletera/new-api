import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  AppInfoResponseDto,
  NewsResponseDto,
  VersionCheckResponseDto,
  FullAppInfoResponseDto,
} from '../dto/app-info.dto';

@Injectable()
export class AppInfoService {
  constructor(private prisma: PrismaService) {}
  async getAppInfo(userVersion?: string): Promise<AppInfoResponseDto> {
    const configs = await this.prisma.system_config.findMany({
      where: {
        key: {
          in: [
            'min_app_version',
            'current_app_version',
            'update_url',
            'maintenance_mode',
            'maintenance_message',
          ],
        },
      },
    });

    const configMap = new Map<string, string>(
      configs.map((c) => [c.key, String(c.value || '')]),
    );

    const minVersion = configMap.get('min_app_version') || '1.0.0';
    const currentVersion = configMap.get('current_app_version') || '1.0.0';
    const updateUrl = configMap.get('update_url') || undefined;
    const maintenanceMode = configMap.get('maintenance_mode') === 'true';
    const maintenanceMessage =
      configMap.get('maintenance_message') || undefined;

    const updateRequired = userVersion
      ? this.isVersionLower(userVersion, minVersion)
      : false;

    const features = await this.getFeatures();

    return {
      minVersion,
      currentVersion,
      updateRequired,
      updateUrl,
      maintenanceMode,
      maintenanceMessage,
      features,
    };
  }
  async checkVersion(
    userVersion: string,
    platform?: string,
  ): Promise<VersionCheckResponseDto> {
    const configKey = platform
      ? `min_app_version_${platform}`
      : 'min_app_version';
    const currentKey = platform
      ? `current_app_version_${platform}`
      : 'current_app_version';
    const updateUrlKey = platform ? `update_url_${platform}` : 'update_url';

    const configs = await this.prisma.system_config.findMany({
      where: {
        key: {
          in: [
            configKey,
            currentKey,
            updateUrlKey,
            'min_app_version',
            'current_app_version',
          ],
        },
      },
    });

    const configMap = new Map<string, string>(
      configs.map((c) => [c.key, String(c.value || '')]),
    );

    const minVersion =
      configMap.get(configKey) || configMap.get('min_app_version') || '1.0.0';
    const currentVersion =
      configMap.get(currentKey) ||
      configMap.get('current_app_version') ||
      '1.0.0';
    const updateUrl = configMap.get(updateUrlKey) || undefined;

    const updateRequired = this.isVersionLower(userVersion, minVersion);
    const updateRecommended = this.isVersionLower(userVersion, currentVersion);

    return {
      minVersion,
      currentVersion,
      userVersion,
      updateRequired,
      updateRecommended,
      updateUrl,
    };
  }
  async getNews(): Promise<NewsResponseDto[]> {
    const now = new Date();

    const news = await this.prisma.news.findMany({
      where: {
        status: 'enable',
        deletedAt: null,
        OR: [{ validFrom: null }, { validFrom: { lte: now } }],
        AND: [
          {
            OR: [{ validTo: null }, { validTo: { gte: now } }],
          },
        ],
      },
      orderBy: [{ order: 'desc' }, { createdAt: 'desc' }],
    });

    return news.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.description || '',
      imageUrl: n.image || undefined,
      actionUrl: n.actionValue || undefined,
      actionLabel: undefined,
      priority: n.order || 0,
      startDate: n.validFrom || undefined,
      endDate: n.validTo || undefined,
      active: n.status === 'enable',
      createdAt: n.createdAt,
    }));
  }
  async getFeatures(): Promise<Record<string, boolean>> {
    const modules = await this.prisma.modules.findMany({
      where: { isActive: 1 },
    });

    const features: Record<string, boolean> = {};
    modules.forEach((m) => {
      features[m.name.toLowerCase()] = m.isActive === 1;
    });

    features['exchange'] = process.env.FEATURE_EXCHANGE !== 'false';
    features['pix'] = process.env.FEATURE_PIX !== 'false';
    features['treasury'] = process.env.FEATURE_TREASURY !== 'false';
    features['transactions'] = process.env.FEATURE_TRANSACTIONS !== 'false';
    features['notifications'] = process.env.FEATURE_NOTIFICATIONS !== 'false';

    return features;
  }
  async getFullInfo(userVersion?: string): Promise<FullAppInfoResponseDto> {
    const [info, news, features] = await Promise.all([
      this.getAppInfo(userVersion),
      this.getNews(),
      this.getFeatures(),
    ]);

    return {
      info,
      news,
      features,
    };
  }
  private isVersionLower(userVersion: string, targetVersion: string): boolean {
    const parseVersion = (v: string) => {
      const parts = v.replace(/[^0-9.]/g, '').split('.');
      return {
        major: parseInt(parts[0] || '0', 10),
        minor: parseInt(parts[1] || '0', 10),
        patch: parseInt(parts[2] || '0', 10),
      };
    };

    const user = parseVersion(userVersion);
    const target = parseVersion(targetVersion);

    if (user.major < target.major) return true;
    if (user.major > target.major) return false;

    if (user.minor < target.minor) return true;
    if (user.minor > target.minor) return false;

    return user.patch < target.patch;
  }
}
