import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { TermsController } from '../../../../src/secure/terms/controllers/terms.controller';
import { TermsService } from '../../../../src/secure/terms/services/terms.service';
import { ServiceType } from '../../../../src/secure/terms/dto/terms.dto';
import { JwtAuthGuard } from '../../../../src/shared/guards/jwt-auth.guard';

describe('TermsController', () => {
  let controller: TermsController;
  let service: jest.Mocked<TermsService>;

  const mockUserId = 'user-123';
  const mockRequest = { ip: '192.168.1.1', headers: { 'x-forwarded-for': '10.0.0.1' } } as any;

  beforeEach(async () => {
    service = {
      check: jest.fn(),
      listAcceptances: jest.fn(),
      checkAllRequired: jest.fn(),
      accept: jest.fn(),
    } as unknown as jest.Mocked<TermsService>;

    const mockAuthGuard: CanActivate = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TermsController],
      providers: [
        { provide: TermsService, useValue: service },
        { provide: JwtAuthGuard, useValue: mockAuthGuard },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get(TermsController);
  });

  describe('check', () => {
    it('should delegate to service', async () => {
      const serviceType = ServiceType.MANTECA_PIX;
      const response = {
        accepted: false,
        serviceType: 'manteca_pix',
      };
      service.check.mockResolvedValue(response);

      const result = await controller.check(mockUserId, serviceType);

      expect(result).toEqual(response);
      expect(service.check).toHaveBeenCalledWith(mockUserId, serviceType);
    });

    it('should return terms acceptance status', async () => {
      const serviceType = ServiceType.MANTECA_EXCHANGE;
      const response = {
        accepted: true,
        serviceType: 'manteca_exchange',
        version: '2.0.0',
        acceptedAt: new Date(),
      };
      service.check.mockResolvedValue(response);

      const result = await controller.check(mockUserId, serviceType);

      expect(result.accepted).toBe(true);
      expect(result.serviceType).toEqual('manteca_exchange');
    });

    it('should handle multiple service types', async () => {
      const serviceTypes = [ServiceType.MANTECA_PIX, ServiceType.MANTECA_EXCHANGE];

      for (const serviceType of serviceTypes) {
        const response = { accepted: false, serviceType };
        service.check.mockResolvedValue(response);

        const result = await controller.check(mockUserId, serviceType);

        expect(result.serviceType).toEqual(serviceType);
      }
    });

    it('should propagate service errors', async () => {
      const serviceType = ServiceType.MANTECA_PIX;
      service.check.mockRejectedValue(new Error('Service type not found'));

      await expect(controller.check(mockUserId, serviceType)).rejects.toThrow('Service type not found');
    });
  });

  describe('listAcceptances', () => {
    it('should delegate to service', async () => {
      const response = [
        {
          id: 'acceptance-1',
          userId: mockUserId,
          serviceType: 'manteca_pix',
          version: '1.0.0',
          acceptedAt: new Date(),
          ipAddress: '192.168.1.1',
        },
        {
          id: 'acceptance-2',
          userId: mockUserId,
          serviceType: 'manteca_exchange',
          version: '1.5.0',
          acceptedAt: new Date(),
          ipAddress: '192.168.1.2',
        },
      ];
      service.listAcceptances.mockResolvedValue(response);

      const result = await controller.listAcceptances(mockUserId);

      expect(result).toEqual(response);
      expect(service.listAcceptances).toHaveBeenCalledWith(mockUserId);
    });

    it('should return array of acceptances', async () => {
      const response = [
        {
          id: 'acceptance-1',
          userId: mockUserId,
          serviceType: 'manteca_pix',
          version: '1.0.0',
          acceptedAt: new Date(),
        },
      ];
      service.listAcceptances.mockResolvedValue(response);

      const result = await controller.listAcceptances(mockUserId);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].serviceType).toBeDefined();
      expect(result[0].acceptedAt).toBeDefined();
    });

    it('should return empty array if no terms accepted', async () => {
      const response: any[] = [];
      service.listAcceptances.mockResolvedValue(response);

      const result = await controller.listAcceptances(mockUserId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toEqual(0);
    });

    it('should propagate service errors', async () => {
      service.listAcceptances.mockRejectedValue(new Error('Failed to fetch acceptances'));

      await expect(controller.listAcceptances(mockUserId)).rejects.toThrow('Failed to fetch acceptances');
    });
  });

  describe('checkRequired', () => {
    it('should delegate to service', async () => {
      const response = {
        allAccepted: false,
        missing: ['manteca_pix'],
        accepted: ['manteca_exchange'],
      };
      service.checkAllRequired.mockResolvedValue(response);

      const result = await controller.checkRequired(mockUserId);

      expect(result).toEqual(response);
      expect(service.checkAllRequired).toHaveBeenCalledWith(mockUserId);
    });

    it('should indicate if all required terms are accepted', async () => {
      const response = { allAccepted: true, missing: [], accepted: ['manteca_pix', 'manteca_exchange'] };
      service.checkAllRequired.mockResolvedValue(response);

      const result = await controller.checkRequired(mockUserId);

      expect(result.allAccepted).toBe(true);
      expect(result.missing.length).toEqual(0);
    });

    it('should list missing terms if not all accepted', async () => {
      const response = {
        allAccepted: false,
        missing: ['manteca_pix'],
        accepted: ['manteca_exchange'],
      };
      service.checkAllRequired.mockResolvedValue(response);

      const result = await controller.checkRequired(mockUserId);

      expect(result.allAccepted).toBe(false);
      expect(Array.isArray(result.missing)).toBe(true);
      expect(result.missing.length).toBeGreaterThan(0);
    });
  });

  describe('accept', () => {
    it('should delegate to service with IP address', async () => {
      const dto = { serviceType: ServiceType.MANTECA_PIX, version: '1.0.0' } as any;
      const response = {
        success: true,
        message: 'Termo aceito com sucesso',
        data: {
          id: 'acceptance-1',
          userId: mockUserId,
          serviceType: 'manteca_pix',
          version: '1.0.0',
          acceptedAt: new Date(),
          ipAddress: '192.168.1.1',
        },
      };
      service.accept.mockResolvedValue(response);

      const result = await controller.accept(mockUserId, dto, mockRequest);

      expect(result).toEqual(response);
      expect(service.accept).toHaveBeenCalledWith(mockUserId, dto, mockRequest.ip);
    });

    it('should extract IP from request', async () => {
      const dto = { serviceType: ServiceType.MANTECA_EXCHANGE, version: '1.5.0' } as any;
      const response = {
        success: true,
        message: 'Term accepted successfully',
        data: {
          id: 'acceptance-2',
          userId: mockUserId,
          serviceType: 'manteca_exchange',
          version: '1.5.0',
          acceptedAt: new Date(),
        },
      };
      service.accept.mockResolvedValue(response);

      const result = await controller.accept(mockUserId, dto, mockRequest);

      expect(service.accept).toHaveBeenCalledWith(mockUserId, dto, mockRequest.ip);
    });

    it('should use x-forwarded-for header if request ip not available', async () => {
      const dto = { serviceType: ServiceType.MANTECA_PIX, version: '1.0.0' } as any;
      const requestWithoutIp = { headers: { 'x-forwarded-for': '10.0.0.5' } } as any;
      const response = {
        success: true,
        message: 'Term accepted successfully',
        data: {
          id: 'acceptance-1',
          userId: mockUserId,
          serviceType: 'manteca_pix',
          version: '1.0.0',
          acceptedAt: new Date(),
        },
      };
      service.accept.mockResolvedValue(response);

      const result = await controller.accept(mockUserId, dto, requestWithoutIp);

      expect(service.accept).toHaveBeenCalledWith(mockUserId, dto, '10.0.0.5');
    });

    it('should return acceptance confirmation', async () => {
      const dto = { serviceType: ServiceType.MANTECA_PIX, version: '1.0.0' } as any;
      const response = {
        success: true,
        message: 'Term accepted successfully',
        data: {
          id: 'acceptance-1',
          userId: mockUserId,
          serviceType: 'manteca_pix',
          version: '1.0.0',
          acceptedAt: new Date(),
        },
      };
      service.accept.mockResolvedValue(response);

      const result = await controller.accept(mockUserId, dto, mockRequest);

      expect(result.message).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data?.serviceType).toEqual('manteca_pix');
    });

    it('should propagate service errors', async () => {
      const dto = { serviceType: ServiceType.MANTECA_PIX, version: '1.0.0' } as any;
      service.accept.mockRejectedValue(new Error('Terms acceptance failed'));

      await expect(controller.accept(mockUserId, dto, mockRequest)).rejects.toThrow('Terms acceptance failed');
    });

    it('should handle accept with null IP', async () => {
      const dto = { serviceType: ServiceType.MANTECA_PIX, version: '1.0.0' } as any;
      const requestWithNullIp = { ip: null, headers: {} } as any;
      const response = {
        success: true,
        message: 'Term accepted successfully',
        data: {
          id: 'acceptance-1',
          userId: mockUserId,
          serviceType: 'manteca_pix',
          version: '1.0.0',
          acceptedAt: new Date(),
        },
      };
      service.accept.mockResolvedValue(response);

      const result = await controller.accept(mockUserId, dto, requestWithNullIp);

      expect(service.accept).toHaveBeenCalledWith(mockUserId, dto, undefined);
    });
  });
});
