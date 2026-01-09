import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { AppInfoController } from '../../../../src/secure/app-info/controllers/app-info.controller';
import { AppInfoService } from '../../../../src/secure/app-info/services/app-info.service';
import { AuthGuard } from '../../../../src/shared/guards/auth.guard';

describe('AppInfoController', () => {
  let controller: AppInfoController;
  let service: jest.Mocked<AppInfoService>;

  beforeEach(async () => {
    service = {
      getFullInfo: jest.fn(),
      getAppInfo: jest.fn(),
      checkVersion: jest.fn(),
      getNews: jest.fn(),
      getFeatures: jest.fn(),
    } as unknown as jest.Mocked<AppInfoService>;

    const mockAuthGuard: CanActivate = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppInfoController],
      providers: [
        { provide: AppInfoService, useValue: service },
        { provide: AuthGuard, useValue: mockAuthGuard },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get(AppInfoController);
  });

  describe('getFullInfo', () => {
    it('should delegate to service', async () => {
      const appVersion = '1.0.0';
      const response = {
        info: {
          minVersion: '0.5.0',
          currentVersion: appVersion,
          updateRequired: false,
          maintenanceMode: false,
          features: { featureA: true, featureB: false },
        },
        news: [],
        features: { featureA: true, featureB: false },
      };
      service.getFullInfo.mockResolvedValue(response);

      const result = await controller.getFullInfo(appVersion);

      expect(result).toEqual(response);
      expect(service.getFullInfo).toHaveBeenCalledWith(appVersion);
    });

    it('should pass app version from header', async () => {
      const appVersion = '2.0.0';
      const response = {
        info: {
          minVersion: '1.0.0',
          currentVersion: appVersion,
          updateRequired: false,
          maintenanceMode: false,
          features: {},
        },
        news: [],
        features: {},
      };
      service.getFullInfo.mockResolvedValue(response);

      const result = await controller.getFullInfo(appVersion);

      expect(result.info.currentVersion).toEqual(appVersion);
    });

    it('should handle undefined app version', async () => {
      const response = {
        info: {
          minVersion: '0.5.0',
          currentVersion: '1.0.0',
          updateRequired: false,
          maintenanceMode: false,
          features: {},
        },
        news: [],
        features: {},
      };
      service.getFullInfo.mockResolvedValue(response);

      const result = await controller.getFullInfo(undefined);

      expect(result).toBeDefined();
      expect(service.getFullInfo).toHaveBeenCalledWith(undefined);
    });

    it('should propagate service errors', async () => {
      service.getFullInfo.mockRejectedValue(new Error('Service unavailable'));

      await expect(controller.getFullInfo('1.0.0')).rejects.toThrow('Service unavailable');
    });
  });

  describe('getBasicInfo', () => {
    it('should delegate to service', async () => {
      const appVersion = '1.0.0';
      const response = {
        minVersion: '0.5.0',
        currentVersion: appVersion,
        updateRequired: false,
        maintenanceMode: false,
        features: {},
      };
      service.getAppInfo.mockResolvedValue(response);

      const result = await controller.getBasicInfo(appVersion);

      expect(result).toEqual(response);
      expect(service.getAppInfo).toHaveBeenCalledWith(appVersion);
    });

    it('should return basic app information', async () => {
      const response = {
        minVersion: '1.0.0',
        currentVersion: '1.5.0',
        updateRequired: false,
        maintenanceMode: false,
        features: {},
      };
      service.getAppInfo.mockResolvedValue(response);

      const result = await controller.getBasicInfo('1.5.0');

      expect(result.currentVersion).toBeDefined();
      expect(result.updateRequired).toBe(false);
    });
  });

  describe('checkVersion', () => {
    it('should check version with query parameter', async () => {
      const query = { version: '1.0.0', platform: 'ios' };
      const response = {
        minVersion: '1.0.0',
        currentVersion: '2.0.0',
        userVersion: '1.0.0',
        updateRequired: false,
        updateRecommended: true,
      };
      service.checkVersion.mockResolvedValue(response);

      const result = await controller.checkVersion(query, undefined);

      expect(result).toEqual(response);
      expect(service.checkVersion).toHaveBeenCalledWith('1.0.0', 'ios');
    });

    it('should use query version over header version', async () => {
      const query = { version: '1.5.0', platform: 'android' };
      const headerVersion = '1.0.0';
      const response = {
        minVersion: '1.0.0',
        currentVersion: '1.5.0',
        userVersion: '1.5.0',
        updateRequired: false,
        updateRecommended: false,
      };
      service.checkVersion.mockResolvedValue(response);

      const result = await controller.checkVersion(query, headerVersion);

      expect(service.checkVersion).toHaveBeenCalledWith('1.5.0', 'android');
    });

    it('should use header version if query version not provided', async () => {
      const query = { platform: 'ios' } as any;
      const headerVersion = '2.0.0';
      const response = {
        minVersion: '1.0.0',
        currentVersion: '2.0.0',
        userVersion: '2.0.0',
        updateRequired: false,
        updateRecommended: false,
      };
      service.checkVersion.mockResolvedValue(response);

      const result = await controller.checkVersion(query, headerVersion);

      expect(service.checkVersion).toHaveBeenCalledWith('2.0.0', 'ios');
    });

    it('should use default version if neither query nor header provided', async () => {
      const query = { platform: 'ios' } as any;
      const response = {
        minVersion: '1.0.0',
        currentVersion: '2.0.0',
        userVersion: '1.0.0',
        updateRequired: false,
        updateRecommended: true,
      };
      service.checkVersion.mockResolvedValue(response);

      const result = await controller.checkVersion(query, undefined);

      expect(service.checkVersion).toHaveBeenCalledWith('1.0.0', 'ios');
    });

    it('should handle version check for different platforms', async () => {
      const queryAndroid = { version: '1.0.0', platform: 'android' };
      const responseAndroid = {
        minVersion: '1.0.0',
        currentVersion: '1.5.0',
        userVersion: '1.0.0',
        updateRequired: false,
        updateRecommended: true,
      };
      service.checkVersion.mockResolvedValue(responseAndroid);

      const result = await controller.checkVersion(queryAndroid, undefined);

      expect(service.checkVersion).toHaveBeenCalledWith('1.0.0', 'android');
      expect(result.updateRecommended).toBe(true);
    });
  });

  describe('getNews', () => {
    it('should delegate to service', async () => {
      const response = [
        { id: 'news-1', title: 'Update Available', message: 'New version released', active: true, priority: 1, createdAt: new Date() },
        { id: 'news-2', title: 'Maintenance', message: 'Server maintenance scheduled', active: true, priority: 2, createdAt: new Date() },
      ];
      service.getNews.mockResolvedValue(response);

      const result = await controller.getNews();

      expect(result).toEqual(response);
      expect(service.getNews).toHaveBeenCalled();
    });

    it('should return array of news', async () => {
      const response = [
        { id: 'news-1', title: 'Update Available', message: 'New version released', active: true, priority: 1, createdAt: new Date() },
      ];
      service.getNews.mockResolvedValue(response);

      const result = await controller.getNews();

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].id).toBeDefined();
      expect(result[0].title).toBeDefined();
    });

    it('should return empty array when no news available', async () => {
      const response: any[] = [];
      service.getNews.mockResolvedValue(response);

      const result = await controller.getNews();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toEqual(0);
    });

    it('should propagate service errors', async () => {
      service.getNews.mockRejectedValue(new Error('Failed to fetch news'));

      await expect(controller.getNews()).rejects.toThrow('Failed to fetch news');
    });
  });

  describe('getFeatures', () => {
    it('should delegate to service', async () => {
      const response = {
        darkMode: true,
        notifications: true,
        biometricAuth: false,
        advancedSearch: true,
        exchange: true,
        pix: true,
      };
      service.getFeatures.mockResolvedValue(response as any);

      const result = await controller.getFeatures();

      expect(result).toEqual(response);
      expect(service.getFeatures).toHaveBeenCalled();
    });

    it('should return features configuration', async () => {
      const response = {
        darkMode: true,
        notifications: true,
        biometricAuth: true,
        exchange: true,
        pix: true,
      };
      service.getFeatures.mockResolvedValue(response as any);

      const result = await controller.getFeatures();

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should include all feature flags', async () => {
      const response = {
        feature1: true,
        feature2: false,
        feature3: true,
        feature4: false,
        exchange: true,
        pix: true,
      };
      service.getFeatures.mockResolvedValue(response as any);

      const result = await controller.getFeatures();

      expect(Object.keys(result as any).length).toBeGreaterThan(0);
    });

    it('should propagate service errors', async () => {
      service.getFeatures.mockRejectedValue(new Error('Failed to fetch features'));

      await expect(controller.getFeatures()).rejects.toThrow('Failed to fetch features');
    });
  });
});
