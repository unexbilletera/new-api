import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from '../../../../src/backoffice/clients/controllers/clients.controller';
import { ClientsService } from '../../../../src/backoffice/clients/services/clients.service';

describe('ClientsController', () => {
  let controller: ClientsController;
  let service: jest.Mocked<ClientsService>;

  const mockClientId = 'client-123';

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      getDetails: jest.fn(),
      getAccounts: jest.fn(),
      getLogs: jest.fn(),
      getTransactions: jest.fn(),
      update: jest.fn(),
      block: jest.fn(),
      unblock: jest.fn(),
      disable: jest.fn(),
      enable: jest.fn(),
    } as unknown as jest.Mocked<ClientsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [{ provide: ClientsService, useValue: service }],
    }).compile();

    controller = module.get(ClientsController);
  });

  describe('list', () => {
    it('should delegate to service', async () => {
      const query = { search: '', status: 'active' } as any;
      const response = {
        data: [
          { id: mockClientId, name: 'Client 1', email: 'client1@example.com', status: 'active' } as any,
        ],
        total: 1,
        page: 1,
        limit: 20,
      };
      service.list.mockResolvedValue(response);

      const result = await controller.list(query);

      expect(result).toEqual(response);
      expect(service.list).toHaveBeenCalledWith(query);
    });

    it('should return paginated list of clients', async () => {
      const query = { page: 1, limit: 10 } as any;
      const response = {
        data: [
          { id: 'client-1', name: 'Client 1', email: 'client1@example.com', status: 'active' } as any,
          { id: 'client-2', name: 'Client 2', email: 'client2@example.com', status: 'inactive' } as any,
        ],
        total: 2,
        page: 1,
        limit: 10,
      };
      service.list.mockResolvedValue(response);

      const result = await controller.list(query);

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.total).toBeDefined();
    });

    it('should support search and filter', async () => {
      const query = { search: 'John', status: 'active', page: 1 } as any;
      const response = { data: [], total: 0, page: 1, limit: 20 };
      service.list.mockResolvedValue(response);

      const result = await controller.list(query);

      expect(service.list).toHaveBeenCalledWith(query);
    });
  });

  describe('getDetails', () => {
    it('should delegate to service', async () => {
      const response = {
        id: mockClientId,
        name: 'Client Name',
        email: 'client@example.com',
        status: 'active',
        createdAt: new Date().toISOString(),
      } as any;
      service.getDetails.mockResolvedValue(response);

      const result = await controller.getDetails(mockClientId);

      expect(result).toEqual(response);
      expect(service.getDetails).toHaveBeenCalledWith(mockClientId);
    });

    it('should return full client details', async () => {
      const response = {
        id: mockClientId,
        name: 'Client Name',
        email: 'client@example.com',
        status: 'active',
        phone: '+5511999999999',
        address: 'Main Street, 123',
        createdAt: new Date().toISOString(),
      } as any;
      service.getDetails.mockResolvedValue(response);

      const result = await controller.getDetails(mockClientId);

      expect(result.id).toEqual(mockClientId);
      expect(result.name).toBeDefined();
      expect(result.email).toBeDefined();
    });

    it('should propagate service errors', async () => {
      service.getDetails.mockRejectedValue(new Error('Client not found'));

      await expect(controller.getDetails(mockClientId)).rejects.toThrow('Client not found');
    });
  });

  describe('getAccounts', () => {
    it('should delegate to service', async () => {
      const response = [
        {
          id: 'acc-1',
          type: 'checking' as any,
          balance: '5000',
          currency: 'BRL',
          status: 'active' as any,
          createdAt: new Date(),
        },
      ];
      service.getAccounts.mockResolvedValue(response);

      const result = await controller.getAccounts(mockClientId);

      expect(result).toEqual(response);
      expect(service.getAccounts).toHaveBeenCalledWith(mockClientId);
    });

    it('should return list of client accounts', async () => {
      const response = [
        {
          id: 'acc-1',
          type: 'checking' as any,
          balance: '5000',
          currency: 'BRL',
          status: 'active' as any,
          createdAt: new Date(),
        },
        {
          id: 'acc-2',
          type: 'savings' as any,
          balance: '10000',
          currency: 'BRL',
          status: 'active' as any,
          createdAt: new Date(),
        },
      ];
      service.getAccounts.mockResolvedValue(response);

      const result = await controller.getAccounts(mockClientId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getLogs', () => {
    it('should delegate to service with pagination', async () => {
      const page = 1;
      const limit = 20;
      const response = {
        data: [
          {
            id: 'log-1',
            userId: mockClientId,
            createdAt: new Date(),
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            device: 'desktop',
            finalStatus: 'success',
          } as any,
        ],
        total: 1,
        page,
        limit,
      };
      service.getLogs.mockResolvedValue(response);

      const result = await controller.getLogs(mockClientId, page, limit);

      expect(result).toEqual(response);
      expect(service.getLogs).toHaveBeenCalledWith(mockClientId, { page, limit });
    });

    it('should return paginated access logs', async () => {
      const response = {
        data: [
          {
            id: 'log-1',
            userId: mockClientId,
            createdAt: new Date(),
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            device: 'desktop',
            finalStatus: 'success',
          } as any,
          {
            id: 'log-2',
            userId: mockClientId,
            createdAt: new Date(),
            ipAddress: '192.168.1.2',
            userAgent: 'Mozilla/5.0',
            device: 'mobile',
            finalStatus: 'success',
          } as any,
        ],
        total: 2,
        page: 1,
        limit: 20,
      };
      service.getLogs.mockResolvedValue(response);

      const result = await controller.getLogs(mockClientId, 1, 20);

      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('getTransactions', () => {
    it('should delegate to service with pagination', async () => {
      const page = 1;
      const limit = 20;
      const response = {
        data: [
          {
            id: 'txn-1',
            number: 1,
            date: new Date(),
            userId: mockClientId,
            type: 'debit' as any,
            status: 'completed' as any,
            createdAt: new Date(),
          } as any,
        ],
        total: 1,
        page,
        limit,
      };
      service.getTransactions.mockResolvedValue(response);

      const result = await controller.getTransactions(mockClientId, page, limit);

      expect(result).toEqual(response);
      expect(service.getTransactions).toHaveBeenCalledWith(mockClientId, { page, limit });
    });

    it('should return paginated transaction history', async () => {
      const response = {
        data: [
          {
            id: 'txn-1',
            number: 1,
            date: new Date(),
            userId: mockClientId,
            type: 'debit' as any,
            status: 'completed' as any,
            createdAt: new Date(),
          } as any,
          {
            id: 'txn-2',
            number: 2,
            date: new Date(),
            userId: mockClientId,
            type: 'credit' as any,
            status: 'completed' as any,
            createdAt: new Date(),
          } as any,
        ],
        total: 2,
        page: 1,
        limit: 20,
      };
      service.getTransactions.mockResolvedValue(response);

      const result = await controller.getTransactions(mockClientId, 1, 20);

      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('update', () => {
    it('should delegate to service', async () => {
      const dto = { name: 'Updated Name', email: 'updated@example.com' } as any;
      const response = { id: mockClientId, name: 'Updated Name', email: 'updated@example.com' } as any;
      service.update.mockResolvedValue(response);

      const result = await controller.update(mockClientId, dto);

      expect(result).toEqual(response);
      expect(service.update).toHaveBeenCalledWith(mockClientId, dto);
    });

    it('should return updated client data', async () => {
      const dto = { name: 'New Name' } as any;
      const response = { id: mockClientId, name: 'New Name', email: 'client@example.com' } as any;
      service.update.mockResolvedValue(response);

      const result = await controller.update(mockClientId, dto);

      expect(result.name).toEqual('New Name');
    });

    it('should propagate service errors', async () => {
      const dto = {} as any;
      service.update.mockRejectedValue(new Error('Update failed'));

      await expect(controller.update(mockClientId, dto)).rejects.toThrow('Update failed');
    });
  });

  describe('block and unblock operations', () => {
    it('block should delegate to service', async () => {
      const dto = { reason: 'Suspicious activity' } as any;
      const response = { success: true, message: 'Client blocked' };
      service.block.mockResolvedValue(response);

      const result = await controller.block(mockClientId, dto);

      expect(result).toEqual(response);
      expect(service.block).toHaveBeenCalledWith(mockClientId, dto);
    });

    it('block should return success response', async () => {
      const dto = { reason: 'Fraud detected' } as any;
      const response = { success: true, message: 'Client blocked' };
      service.block.mockResolvedValue(response);

      const result = await controller.block(mockClientId, dto);

      expect(result.success).toEqual(true);
      expect(result.message).toBeDefined();
    });

    it('unblock should delegate to service', async () => {
      const response = { success: true, message: 'Client unblocked' };
      service.unblock.mockResolvedValue(response);

      const result = await controller.unblock(mockClientId);

      expect(result).toEqual(response);
      expect(service.unblock).toHaveBeenCalledWith(mockClientId);
    });

    it('unblock should return success response', async () => {
      const response = { success: true, message: 'Client unblocked' };
      service.unblock.mockResolvedValue(response);

      const result = await controller.unblock(mockClientId);

      expect(result.success).toEqual(true);
      expect(result.message).toBeDefined();
    });
  });

  describe('disable and enable operations', () => {
    it('disable should delegate to service', async () => {
      const dto = { reason: 'Account requested closure' } as any;
      const response = { success: true, message: 'Client disabled' };
      service.disable.mockResolvedValue(response);

      const result = await controller.disable(mockClientId, dto);

      expect(result).toEqual(response);
      expect(service.disable).toHaveBeenCalledWith(mockClientId, dto);
    });

    it('disable should return success response', async () => {
      const dto = { reason: 'User request' } as any;
      const response = { success: true, message: 'Client disabled' };
      service.disable.mockResolvedValue(response);

      const result = await controller.disable(mockClientId, dto);

      expect(result.success).toEqual(true);
      expect(result.message).toBeDefined();
    });

    it('enable should delegate to service', async () => {
      const response = { success: true, message: 'Client enabled' };
      service.enable.mockResolvedValue(response);

      const result = await controller.enable(mockClientId);

      expect(result).toEqual(response);
      expect(service.enable).toHaveBeenCalledWith(mockClientId);
    });

    it('enable should return success response', async () => {
      const response = { success: true, message: 'Client enabled' };
      service.enable.mockResolvedValue(response);

      const result = await controller.enable(mockClientId);

      expect(result.success).toEqual(true);
      expect(result.message).toBeDefined();
    });
  });
});
