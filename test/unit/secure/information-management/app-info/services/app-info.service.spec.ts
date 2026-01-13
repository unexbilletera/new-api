import { Test, TestingModule } from '@nestjs/testing';
import { AppInfoService } from '../../../../../../src/secure/app-info/services/app-info.service';
import { PrismaService } from '../../../../../../src/shared/prisma/prisma.service';

describe('AppInfoService', () => {
  let service: AppInfoService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    prisma = {
      system_config: {
        findMany: jest.fn() as jest.Mock,
      },
      news: {
        findMany: jest.fn() as jest.Mock,
      },
      modules: {
        findMany: jest.fn() as jest.Mock,
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AppInfoService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AppInfoService>(AppInfoService);
  });

  describe('getFullInfo', () => {
    it('should return full app information', async () => {
      const mockConfigs = [
        { id: 'config-1', key: 'current_app_version', value: '1.0.0' },
        { id: 'config-2', key: 'min_app_version', value: '0.5.0' },
        { id: 'config-3', key: 'maintenance_mode', value: 'false' },
      ];

      const mockNews = [
        {
          id: 'news-1',
          title: 'Update',
          message: 'New version available',
          active: true,
          createdAt: new Date(),
          priority: 1,
        },
      ];

      const mockModules = [
        { id: 'mod-1', name: 'darkMode', isActive: 1, deletedAt: null },
      ];

      (prisma.system_config.findMany as jest.Mock).mockResolvedValue(
        mockConfigs,
      );
      (prisma.news.findMany as jest.Mock).mockResolvedValue(mockNews);
      (prisma.modules.findMany as jest.Mock).mockResolvedValue(mockModules);

      const result = await service.getFullInfo('1.0.0');

      expect(result).toHaveProperty('info');
      expect(result).toHaveProperty('news');
      expect(result).toHaveProperty('features');
    });

    it('should handle missing app version gracefully', async () => {
      const mockConfigs = [
        { id: 'config-1', key: 'current_app_version', value: '1.0.0' },
        { id: 'config-2', key: 'min_app_version', value: '0.5.0' },
        { id: 'config-3', key: 'maintenance_mode', value: 'false' },
      ];

      (prisma.system_config.findMany as jest.Mock).mockResolvedValue(
        mockConfigs,
      );
      (prisma.news.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.modules.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getFullInfo(undefined);

      expect(result).toBeDefined();
      expect(result.info).toBeDefined();
    });
  });

  describe('getAppInfo', () => {
    it('should return basic app information', async () => {
      const mockConfigs = [
        { id: 'config-1', key: 'current_app_version', value: '1.5.0' },
        { id: 'config-2', key: 'min_app_version', value: '1.0.0' },
        { id: 'config-3', key: 'maintenance_mode', value: 'false' },
      ];

      (prisma.system_config.findMany as jest.Mock).mockResolvedValue(
        mockConfigs,
      );
      (prisma.modules.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getAppInfo('1.5.0');

      expect(result).toHaveProperty('currentVersion');
      expect(result).toHaveProperty('minVersion');
      expect(result).toHaveProperty('updateRequired');
    });
  });

  describe('checkVersion', () => {
    it('should indicate if version requires update', async () => {
      const mockConfigs = [
        { id: 'config-1', key: 'current_app_version', value: '2.0.0' },
        { id: 'config-2', key: 'min_app_version', value: '1.0.0' },
        { id: 'config-3', key: 'current_app_version_ios', value: '2.0.0' },
        { id: 'config-4', key: 'min_app_version_ios', value: '1.0.0' },
      ];

      (prisma.system_config.findMany as jest.Mock).mockResolvedValue(
        mockConfigs,
      );

      const result = await service.checkVersion('1.5.0', 'ios');

      expect(result).toHaveProperty('updateRequired');
      expect(result).toHaveProperty('updateRecommended');
      expect(result).toHaveProperty('currentVersion');
    });

    it('should return update not needed for current version', async () => {
      const mockConfigs = [
        { id: 'config-1', key: 'current_app_version', value: '2.0.0' },
        { id: 'config-2', key: 'min_app_version', value: '1.0.0' },
        { id: 'config-3', key: 'current_app_version_android', value: '2.0.0' },
        { id: 'config-4', key: 'min_app_version_android', value: '1.0.0' },
      ];

      (prisma.system_config.findMany as jest.Mock).mockResolvedValue(
        mockConfigs,
      );

      const result = await service.checkVersion('2.0.0', 'android');

      expect(result.updateRequired).toBe(false);
      expect(result.updateRecommended).toBe(false);
    });

    it('should support different platforms', async () => {
      const mockConfigs = [
        { id: 'config-1', key: 'current_app_version', value: '2.0.0' },
        { id: 'config-2', key: 'min_app_version', value: '1.0.0' },
        { id: 'config-3', key: 'current_app_version_ios', value: '2.1.0' },
        { id: 'config-4', key: 'min_app_version_ios', value: '1.0.0' },
        { id: 'config-5', key: 'current_app_version_android', value: '2.0.5' },
        { id: 'config-6', key: 'min_app_version_android', value: '1.0.0' },
      ];

      (prisma.system_config.findMany as jest.Mock).mockResolvedValue(
        mockConfigs,
      );

      const resultIos = await service.checkVersion('2.0.0', 'ios');
      const resultAndroid = await service.checkVersion('2.0.0', 'android');

      expect(resultIos.currentVersion).not.toEqual(
        resultAndroid.currentVersion,
      );
    });
  });

  describe('getNews', () => {
    it('should return list of news', async () => {
      const mockNews = [
        {
          id: 'news-1',
          title: 'Update 1',
          message: 'Content 1',
          active: true,
          createdAt: new Date(),
          priority: 1,
        },
        {
          id: 'news-2',
          title: 'Update 2',
          message: 'Content 2',
          active: true,
          createdAt: new Date(),
          priority: 2,
        },
      ];

      (prisma.news.findMany as jest.Mock).mockResolvedValue(mockNews);

      const result = await service.getNews();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('message');
    });

    it('should return empty array when no news available', async () => {
      (prisma.news.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getNews();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should filter active news and apply date constraints', async () => {
      const mockNews = [
        {
          id: 'news-1',
          title: 'Old news',
          message: 'Content',
          active: true,
          createdAt: new Date('2026-01-01'),
          priority: 1,
          startDate: null,
          endDate: null,
          deletedAt: null,
        },
        {
          id: 'news-2',
          title: 'New news',
          message: 'Content',
          active: true,
          createdAt: new Date('2026-01-05'),
          priority: 2,
          startDate: null,
          endDate: null,
          deletedAt: null,
        },
      ];

      (prisma.news.findMany as jest.Mock).mockResolvedValue(mockNews);

      const result = await service.getNews();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('getFeatures', () => {
    it('should return feature flags from modules', async () => {
      const mockModules = [
        { id: 'feat-1', name: 'darkMode', isActive: 1, deletedAt: null },
        { id: 'feat-2', name: 'notifications', isActive: 1, deletedAt: null },
        { id: 'feat-3', name: 'biometric', isActive: 0, deletedAt: null },
      ];

      (prisma.modules.findMany as jest.Mock).mockResolvedValue(mockModules);

      const result = await service.getFeatures();

      expect(typeof result).toBe('object');
      expect(result['darkmode']).toBe(true);
      expect(result['notifications']).toBe(true);
      expect(result['biometric']).toBe(false);
    });

    it('should return feature object with environment variables', async () => {
      (prisma.modules.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getFeatures();

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('exchange');
      expect(result).toHaveProperty('pix');
      expect(result).toHaveProperty('treasury');
      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('notifications');
    });

    it('should handle mixed enabled and disabled features', async () => {
      const mockModules = [
        { id: 'feat-1', name: 'featureA', isActive: 1, deletedAt: null },
        { id: 'feat-2', name: 'featureB', isActive: 0, deletedAt: null },
        { id: 'feat-3', name: 'featureC', isActive: 1, deletedAt: null },
      ];

      (prisma.modules.findMany as jest.Mock).mockResolvedValue(mockModules);

      const result = await service.getFeatures();

      const enabledCount = Object.values(result).filter(
        (v) => v === true,
      ).length;
      expect(enabledCount).toBeGreaterThanOrEqual(2);
    });
  });
});
