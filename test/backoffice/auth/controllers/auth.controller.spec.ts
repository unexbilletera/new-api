import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../../src/backoffice/auth/controllers/auth.controller';
import { AuthService } from '../../../../src/backoffice/auth/services/auth.service';
import { BackofficeAuthGuard } from '../../../../src/shared/guards/backoffice-auth.guard';

describe('BackofficeAuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  const mockCurrentUserPayload = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    roleId: 'role-1',
    role: {
      id: 'role-1',
      name: 'Administrator',
      level: 3,
    },
  };

  const mockUserResponse = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: {
      id: 'role-1',
      name: 'Administrator',
      level: 3,
    },
    createdAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    service = {
      login: jest.fn(),
      getUserById: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    })
      .overrideGuard(BackofficeAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AuthController);
  });

  describe('login', () => {
    it('should delegate to service', async () => {
      const dto = { email: 'admin@example.com', password: 'securepass123' } as any;
      const response = {
        accessToken: 'jwt_token_123',
        expiresIn: 3600,
        user: mockUserResponse,
        message: 'Login performed successfully',
        code: 'LOGIN_SUCCESS',
      };
      service.login.mockResolvedValue(response);

      const result = await controller.login(dto);

      expect(result).toEqual(response);
      expect(service.login).toHaveBeenCalledWith(dto);
    });

    it('should return access token and user data', async () => {
      const dto = { email: 'admin@example.com', password: 'securepass123' } as any;
      const response = {
        accessToken: 'jwt_token_abc',
        expiresIn: 3600,
        user: mockUserResponse,
        message: 'Login performed successfully',
        code: 'LOGIN_SUCCESS',
      };
      service.login.mockResolvedValue(response);

      const result = await controller.login(dto);

      expect(result.accessToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.role.id).toBeDefined();
    });

    it('should include user role information', async () => {
      const dto = { email: 'admin@example.com', password: 'securepass123' } as any;
      const response = {
        accessToken: 'jwt_token_123',
        expiresIn: 3600,
        user: mockUserResponse,
        message: 'Login performed successfully',
        code: 'LOGIN_SUCCESS',
      };
      service.login.mockResolvedValue(response);

      const result = await controller.login(dto);

      expect(result.user.role.name).toEqual('Administrator');
      expect(result.user.role.level).toEqual(3);
    });

    it('should propagate service errors', async () => {
      const dto = { email: 'admin@example.com', password: 'wrongpass' } as any;
      service.login.mockRejectedValue(new Error('Invalid credentials'));

      await expect(controller.login(dto)).rejects.toThrow('Invalid credentials');
    });

    it('should return 200 OK status code (via HttpCode decorator)', async () => {
      const dto = { email: 'admin@example.com', password: 'securepass123' } as any;
      const response = {
        accessToken: 'jwt_token_123',
        expiresIn: 3600,
        user: mockUserResponse,
        message: 'Login performed successfully',
        code: 'LOGIN_SUCCESS',
      };
      service.login.mockResolvedValue(response);

      const result = await controller.login(dto);

      expect(result).toBeDefined();
    });
  });

  describe('getMe', () => {
    it('should delegate to service with user id', async () => {
      service.getUserById.mockResolvedValue(mockUserResponse);

      const result = await controller.getMe(mockCurrentUserPayload);

      expect(result).toEqual(mockUserResponse);
      expect(service.getUserById).toHaveBeenCalledWith(mockCurrentUserPayload.id);
    });

    it('should return current user information', async () => {
      service.getUserById.mockResolvedValue(mockUserResponse);

      const result = await controller.getMe(mockCurrentUserPayload);

      expect(result.id).toEqual(mockUserResponse.id);
      expect(result.email).toEqual(mockUserResponse.email);
      expect(result.name).toEqual(mockUserResponse.name);
    });

    it('should return user with complete role information', async () => {
      service.getUserById.mockResolvedValue(mockUserResponse);

      const result = await controller.getMe(mockCurrentUserPayload);

      expect(result.role).toBeDefined();
      expect(result.role.id).toBeDefined();
      expect(result.role.name).toBeDefined();
      expect(result.role.level).toBeDefined();
    });

    it('should propagate service errors', async () => {
      service.getUserById.mockRejectedValue(new Error('User not found'));

      await expect(controller.getMe(mockCurrentUserPayload)).rejects.toThrow('User not found');
    });

    it('should handle different admin roles', async () => {
      const managerCurrentUserPayload = {
        id: 'manager-456',
        email: 'manager@example.com',
        name: 'Manager User',
        roleId: 'role-2',
        role: { id: 'role-2', name: 'Manager', level: 2 },
      };

      const managerResponse = {
        id: 'manager-456',
        email: 'manager@example.com',
        name: 'Manager User',
        role: { id: 'role-2', name: 'Manager', level: 2 },
        createdAt: new Date('2025-01-01'),
      };

      service.getUserById.mockResolvedValue(managerResponse);

      const result = await controller.getMe(managerCurrentUserPayload);

      expect(result.role.level).toEqual(2);
      expect(result.role.name).toEqual('Manager');
    });
  });
});
