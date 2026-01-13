import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../../../src/health/health.controller';
import { HealthService } from '../../../src/health/services/health.service';
import { HealthResponseDto } from '../../../src/health/dto/response';

describe('HealthController', () => {
  let controller: HealthController;
  let service: jest.Mocked<HealthService>;

  const mockHealthResponse: HealthResponseDto = {
    status: 'ok',
    uptime: '1234s',
    timestamp: '2026-01-07T10:00:00Z',
    checks: {
      database: 'up',
      server: 'running',
    },
  };

  beforeEach(async () => {
    service = {
      check: jest.fn(),
    } as unknown as jest.Mocked<HealthService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: service }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('check', () => {
    it('should delegate to service', async () => {
      service.check.mockResolvedValue(mockHealthResponse);

      const result = await controller.check();

      expect(result).toEqual(mockHealthResponse);
      expect(service.check).toHaveBeenCalled();
    });

    it('should return health status when database is up', async () => {
      const response: HealthResponseDto = {
        status: 'ok',
        uptime: '5000s',
        timestamp: '2026-01-07T10:15:00Z',
        checks: {
          database: 'up',
          server: 'running',
        },
      };
      service.check.mockResolvedValue(response);

      const result = await controller.check();

      expect(result.status).toEqual('ok');
      expect(result.checks.database).toEqual('up');
      expect(result.checks.server).toEqual('running');
    });

    it('should return error status when database is down', async () => {
      const response: HealthResponseDto = {
        status: 'error',
        uptime: '3000s',
        timestamp: '2026-01-07T10:20:00Z',
        checks: {
          database: 'down',
          server: 'running',
        },
      };
      service.check.mockResolvedValue(response);

      const result = await controller.check();

      expect(result.status).toEqual('error');
      expect(result.checks.database).toEqual('down');
    });

    it('should propagate service errors', async () => {
      const error = new Error('Health check failed');
      service.check.mockRejectedValue(error);

      await expect(controller.check()).rejects.toThrow('Health check failed');
      expect(service.check).toHaveBeenCalled();
    });
  });
});
