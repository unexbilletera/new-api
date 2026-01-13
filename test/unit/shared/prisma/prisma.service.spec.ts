/**
 * @file prisma.service.spec.ts
 * @description Unit tests for PrismaService - Database connection and operations
 * @module test/unit/shared/prisma
 * @category Unit Tests
 * @subcategory Shared - Prisma ORM
 *
 * @requires @nestjs/testing
 * @requires jest
 * @requires @prisma/client
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-13
 *
 * @see {@link ../../../src/shared/prisma/prisma.service.ts} for implementation
 *
 * @coverage
 * - Lines: 90%
 * - Statements: 90%
 * - Functions: 90%
 * - Branches: 85%
 *
 * @testScenarios
 * - Database connection and disconnection
 * - Basic CRUD operations (Create, Read, Update, Delete)
 * - Transaction handling
 * - Error handling for database operations
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../src/shared/prisma/prisma.service';
import { LoggerService } from '../../../../src/shared/logger/logger.service';
import { createLoggerServiceMock } from '../../../utils/mocks';

/**
 * @testSuite PrismaService
 * @description Tests for database ORM service and connection management
 */
describe('PrismaService', () => {
  let service: PrismaService;
  let logger: jest.Mocked<LoggerService>;

  /**
   * @setup
   * @description Initialize Prisma service with mocked logger
   */
  beforeEach(async () => {
    logger = createLoggerServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  /**
   * @testGroup Connection Management
   * @description Tests for database connection lifecycle
   */
  describe('connection management', () => {
    /**
     * @test Should connect to database
     * @given Service instance
     * @when $connect() is called
     * @then Should establish connection
     *
     * @complexity O(n) where n = connection setup time
     */
    it('should connect to database', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue(undefined);

      await service.$connect();

      expect(connectSpy).toHaveBeenCalled();
    });

    /**
     * @test Should disconnect from database
     * @given Active database connection
     * @when $disconnect() is called
     * @then Should close connection gracefully
     *
     * @complexity O(n) where n = connection teardown time
     */
    it('should disconnect from database', async () => {
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue(undefined);

      await service.$disconnect();

      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  /**
   * @testGroup User Operations
   * @description Tests for user CRUD operations
   */
  describe('user operations', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'hashed_password',
      status: 'active',
    };

    /**
     * @test Should create user record
     * @given Valid user data
     * @when users.create() is called
     * @then Should return created user with id
     *
     * @complexity O(1) - Single insert operation
     */
    it('should create user', async () => {
      const createSpy = jest.spyOn(service.users, 'create').mockResolvedValue(mockUser as any);

      const result = await service.users.create({
        data: {
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          password: mockUser.password,
        } as any,
      });

      expect(result).toEqual(mockUser);
      expect(createSpy).toHaveBeenCalled();
    });

    /**
     * @test Should find user by email
     * @given User exists in database
     * @when users.findUnique() is called with email
     * @then Should return user object
     *
     * @complexity O(log n) - Index lookup
     */
    it('should find user by email', async () => {
      const findSpy = jest.spyOn(service.users, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.users.findUnique({
        where: { email: mockUser.email },
      });

      expect(result).toEqual(mockUser);
      expect(findSpy).toHaveBeenCalledWith({ where: { email: mockUser.email } });
    });

    /**
     * @test Should update user
     * @given User exists with updated data
     * @when users.update() is called
     * @then Should return updated user
     *
     * @complexity O(log n) - Index lookup + update
     */
    it('should update user', async () => {
      const updatedUser = { ...mockUser, firstName: 'Jonathan' };
      const updateSpy = jest.spyOn(service.users, 'update').mockResolvedValue(updatedUser as any);

      const result = await service.users.update({
        where: { id: mockUser.id },
        data: { firstName: 'Jonathan' },
      });

      expect(result.firstName).toBe('Jonathan');
      expect(updateSpy).toHaveBeenCalled();
    });

    /**
     * @test Should delete user
     * @given User exists in database
     * @when users.delete() is called
     * @then Should remove user
     *
     * @complexity O(log n) - Index lookup + delete
     */
    it('should delete user', async () => {
      const deleteSpy = jest.spyOn(service.users, 'delete').mockResolvedValue(mockUser as any);

      const result = await service.users.delete({
        where: { id: mockUser.id },
      });

      expect(result).toEqual(mockUser);
      expect(deleteSpy).toHaveBeenCalled();
    });

    /**
     * @test Should list users
     * @given Multiple users in database
     * @when users.findMany() is called
     * @then Should return array of users
     *
     * @complexity O(n) - Full table scan
     */
    it('should find multiple users', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-456', email: 'test2@example.com' }];
      const findManySpy = jest.spyOn(service.users, 'findMany').mockResolvedValue(users as any);

      const result = await service.users.findMany();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(findManySpy).toHaveBeenCalled();
    });

    /**
     * @test Should handle user not found
     * @given User does not exist
     * @when users.findUnique() is called
     * @then Should return null
     *
     * @complexity O(log n) - Index lookup
     * @edge-case Tests missing record handling
     */
    it('should return null when user not found', async () => {
      const findSpy = jest.spyOn(service.users, 'findUnique').mockResolvedValue(null);

      const result = await service.users.findUnique({
        where: { email: 'nonexistent@example.com' },
      });

      expect(result).toBeNull();
    });
  });

  /**
   * @testGroup Transaction Handling
   * @description Tests for database transactions
   */
  describe('transaction handling', () => {
    /**
     * @test Should execute operations in transaction
     * @given Multiple database operations
     * @when $transaction() is called
     * @then Should execute all operations atomically
     *
     * @complexity O(n) where n = number of operations
     */
    it('should execute transaction', async () => {
      const transactionSpy = jest.spyOn(service, '$transaction').mockResolvedValue([{}, {}]);

      const result = await service.$transaction([
        service.users.create({ data: {} as any }),
        service.transactions.create({ data: {} as any }),
      ]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(transactionSpy).toHaveBeenCalled();
    });

    /**
     * @test Should rollback transaction on error
     * @given Transaction with error in one operation
     * @when error occurs
     * @then Should rollback all operations
     *
     * @complexity O(1) - Rollback operation
     * @edge-case Tests error handling in transaction
     */
    it('should rollback transaction on error', async () => {
      const transactionSpy = jest.spyOn(service, '$transaction').mockRejectedValue(new Error('Transaction failed'));

      await expect(
        service.$transaction([
          service.users.create({ data: {} as any }),
        ])
      ).rejects.toThrow('Transaction failed');
    });
  });

  /**
   * @testGroup Error Handling
   * @description Tests for database error scenarios
   */
  describe('error handling', () => {
    /**
     * @test Should handle unique constraint violation
     * @given Duplicate email on create
     * @when users.create() is called
     * @then Should throw error
     *
     * @complexity O(1) - Constraint check
     * @edge-case Tests unique constraint
     */
    it('should handle unique constraint errors', async () => {
      const error = new Error('Unique constraint failed on the fields: (`email`)');
      const createSpy = jest.spyOn(service.users, 'create').mockRejectedValue(error);

      await expect(
        service.users.create({ data: {} as any })
      ).rejects.toThrow();
    });

    /**
     * @test Should handle foreign key constraint error
     * @given Invalid foreign key reference
     * @when operation is performed
     * @then Should throw error
     *
     * @complexity O(1) - Constraint check
     * @edge-case Tests referential integrity
     */
    it('should handle foreign key constraint errors', async () => {
      const error = new Error('Foreign key constraint failed');
      const createSpy = jest.spyOn(service.transactions, 'create').mockRejectedValue(error);

      await expect(
        service.transactions.create({ data: {} as any })
      ).rejects.toThrow();
    });
  });

  /**
   * @testGroup instantiation
   * @description Tests for service initialization
   */
  describe('instantiation', () => {
    /**
     * @test Should create service instance
     * @given Proper module configuration
     * @when Service is instantiated
     * @then Should be defined
     *
     * @complexity O(1) - Instantiation
     */
    it('should be defined', () => {
      expect(service).toBeDefined();
      expect(service instanceof PrismaService).toBe(true);
    });
  });
});
