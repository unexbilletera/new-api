/**
 * @file user.controller.spec.ts
 * @description Unit tests for UserController - User API endpoint handling
 * @module test/unit/public/users/controllers
 * @category Unit Tests
 * @subcategory Public - User Management
 *
 * @requires @nestjs/testing
 * @requires jest
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-14
 *
 * @see {@link ../../../../../src/public/users/controllers/user.controller.ts} for implementation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { UserController } from '../../../../../src/public/users/controllers/user.controller';
import { UserProfileService } from '../../../../../src/public/users/services/user-profile.service';
import { EmailChangeService } from '../../../../../src/public/users/services/email-change.service';
import { PasswordService } from '../../../../../src/public/users/services/password.service';
import { SessionService } from '../../../../../src/public/users/services/session.service';
import { AccountClosureService } from '../../../../../src/public/users/services/account-closure.service';
import { LivenessService } from '../../../../../src/public/users/services/liveness.service';
import { IdentityService } from '../../../../../src/public/users/services/identity.service';
import { AccountService } from '../../../../../src/public/users/services/account.service';
import { OnboardingStatusService } from '../../../../../src/public/users/services/onboarding-status.service';
import { MessagingService } from '../../../../../src/public/users/services/messaging.service';
import { JwtAuthGuard } from '../../../../../src/shared/guards/jwt-auth.guard';
import { mockActiveUser } from '../../../../utils';

/**
 * @testSuite UserController
 * @description Comprehensive test suite for user endpoint handling
 */
describe('UserController', () => {
  let controller: any;
  let service: any;

  /**
   * @setup
   * @description Initialize user controller with mocked service
   */
  beforeEach(async () => {
    const userProfileService = {
      getCurrentUser: jest.fn(),
      updateProfile: jest.fn(),
    };
    const emailChangeService = {
      requestEmailChange: jest.fn(),
      confirmEmailChange: jest.fn(),
    };
    const passwordService = { changePassword: jest.fn() };
    const sessionService = { signout: jest.fn() };
    const accountClosureService = { closeAccount: jest.fn() };
    const livenessService = { checkLiveness: jest.fn() };
    const identityService = {
      listIdentities: jest.fn(),
      setDefaultIdentity: jest.fn(),
    };
    const accountService = {
      listAccounts: jest.fn(),
      setDefaultAccount: jest.fn(),
      setAccountAlias: jest.fn(),
      getBalance: jest.fn(),
    };
    const onboardingStatusService = { getStatus: jest.fn() };
    const messagingService = { sendMessage: jest.fn() };

    const mockAuthGuard: CanActivate = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserProfileService, useValue: userProfileService },
        { provide: EmailChangeService, useValue: emailChangeService },
        { provide: PasswordService, useValue: passwordService },
        { provide: SessionService, useValue: sessionService },
        { provide: AccountClosureService, useValue: accountClosureService },
        { provide: LivenessService, useValue: livenessService },
        { provide: IdentityService, useValue: identityService },
        { provide: AccountService, useValue: accountService },
        { provide: OnboardingStatusService, useValue: onboardingStatusService },
        { provide: MessagingService, useValue: messagingService },
        { provide: JwtAuthGuard, useValue: mockAuthGuard },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<UserController>(UserController);
    service = userProfileService;
  });

  /**
   * @testGroup getProfile
   * @description Tests for retrieving current user profile
   */
  describe('getProfile', () => {
    /**
     * @test Should return current user profile
     * @given Authenticated user request
     * @when getProfile() is called
     * @then Should return user object with all profile data
     */
    it('should return current user profile', async () => {
      const userId = 'user-123';
      service.getCurrentUser.mockResolvedValue(mockActiveUser);

      const result = await controller.getCurrentUser({ id: userId } as any);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockActiveUser.id);
      expect(service.getCurrentUser).toHaveBeenCalledWith(userId, undefined, false);
    });

    /**
     * @test Should include all profile fields
     * @given User with complete profile
     * @when getCurrentUser() is called
     * @then Response should contain email, name, status fields
     */
    it('should include all required profile fields', async () => {
      const userId = 'user-123';
      service.getCurrentUser.mockResolvedValue(mockActiveUser);

      const result = await controller.getCurrentUser({ id: userId } as any);

      expect(result.email).toBeDefined();
      expect(result.firstName).toBeDefined();
      expect(result.lastName).toBeDefined();
    });
  });

  /**
   * @testGroup updateProfile
   * @description Tests for updating user profile information
   */
  describe('updateProfile', () => {
    /**
     * @test Should update user profile successfully
     * @given Valid user ID and update data
     * @when updateProfile() is called
     * @then Should return updated user object
     */
    it('should update user profile', async () => {
      const userId = 'user-123';
      const updateDto = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const updatedUser = { ...mockActiveUser, ...updateDto };
      service.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(
        { id: userId } as any,
        updateDto,
      );

      expect(result.firstName).toBe(updateDto.firstName);
      expect(service.updateProfile).toHaveBeenCalledWith(userId, updateDto);
    });

    /**
     * @test Should validate required fields in update
     * @given Partial update DTO
     * @when updateProfile() is called
     * @then Should only update provided fields
     */
    it('should handle partial updates', async () => {
      const userId = 'user-123';
      const updateDto = { firstName: 'Jane' };

      const updatedUser = { ...mockActiveUser, firstName: 'Jane' };
      service.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(
        { id: userId } as any,
        updateDto,
      );

      expect(result.firstName).toBe('Jane');
      expect(service.updateProfile).toHaveBeenCalledWith(userId, updateDto);
    });
  });

  /**
   * @testGroup instantiation
   * @description Tests for controller initialization
   */
  describe('instantiation', () => {
    /**
     * @test Should create controller instance
     * @given Proper module configuration
     * @when Controller is instantiated
     * @then Should be defined
     */
    it('should be defined', () => {
      expect(controller).toBeDefined();
      expect(controller instanceof UserController).toBe(true);
    });
  });
});
