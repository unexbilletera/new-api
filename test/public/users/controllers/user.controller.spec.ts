import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, CanActivate } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserController } from '../../../../src/public/users/controllers/user.controller';
import { UserProfileService } from '../../../../src/public/users/services/user-profile.service';
import { EmailChangeService } from '../../../../src/public/users/services/email-change.service';
import { PasswordService } from '../../../../src/public/users/services/password.service';
import { SessionService } from '../../../../src/public/users/services/session.service';
import { AccountClosureService } from '../../../../src/public/users/services/account-closure.service';
import { LivenessService } from '../../../../src/public/users/services/liveness.service';
import { IdentityService } from '../../../../src/public/users/services/identity.service';
import { AccountService } from '../../../../src/public/users/services/account.service';
import { OnboardingStatusService } from '../../../../src/public/users/services/onboarding-status.service';
import { MessagingService } from '../../../../src/public/users/services/messaging.service';
import { AuthGuard } from '../../../../src/shared/guards/auth.guard';

describe('UserController', () => {
  let controller: UserController;
  let userProfileService: jest.Mocked<UserProfileService>;
  let emailChangeService: jest.Mocked<EmailChangeService>;
  let passwordService: jest.Mocked<PasswordService>;
  let sessionService: jest.Mocked<SessionService>;
  let accountClosureService: jest.Mocked<AccountClosureService>;
  let livenessService: jest.Mocked<LivenessService>;
  let identityService: jest.Mocked<IdentityService>;
  let accountService: jest.Mocked<AccountService>;
  let onboardingStatusService: jest.Mocked<OnboardingStatusService>;
  let messagingService: jest.Mocked<MessagingService>;

  const mockUser = { id: 'user-123', email: 'test@example.com', roleId: 'role-1' };
  const mockFastifyRequest = {
    headers: {
      'x-forwarded-for': '192.168.1.1',
      'user-agent': 'Mozilla/5.0',
    },
    socket: { remoteAddress: '127.0.0.1' },
  } as any;

  beforeEach(async () => {
    userProfileService = {
      getCurrentUser: jest.fn(),
      updateProfile: jest.fn(),
      updateAddress: jest.fn(),
    } as unknown as jest.Mocked<UserProfileService>;

    emailChangeService = {
      requestEmailChange: jest.fn(),
      confirmEmailChange: jest.fn(),
    } as unknown as jest.Mocked<EmailChangeService>;

    passwordService = {
      changePassword: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;

    sessionService = {
      signout: jest.fn(),
    } as unknown as jest.Mocked<SessionService>;

    accountClosureService = {
      closeAccount: jest.fn(),
    } as unknown as jest.Mocked<AccountClosureService>;

    livenessService = {
      livenessCheck: jest.fn(),
    } as unknown as jest.Mocked<LivenessService>;

    identityService = {
      getUserIdentities: jest.fn(),
      setDefaultIdentity: jest.fn(),
    } as unknown as jest.Mocked<IdentityService>;

    accountService = {
      setDefaultAccount: jest.fn(),
      setUserAccountAlias: jest.fn(),
      getAccountBalances: jest.fn(),
      getUserAccountInfo: jest.fn(),
    } as unknown as jest.Mocked<AccountService>;

    onboardingStatusService = {
      onboarding: jest.fn(),
    } as unknown as jest.Mocked<OnboardingStatusService>;

    messagingService = {
      sendMessage: jest.fn(),
    } as unknown as jest.Mocked<MessagingService>;

    const mockAuthGuard: CanActivate = {
      canActivate: jest.fn(() => true),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      decode: jest.fn(),
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
        { provide: AuthGuard, useValue: mockAuthGuard },
        { provide: JwtService, useValue: mockJwtService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get(UserController);
  });

  describe('getCurrentUser', () => {
    it('should delegate to userProfileService', async () => {
      const response = {
        success: true,
        user: {
          ...mockUser,
          phone: null,
          firstName: 'Test',
          lastName: 'User',
          name: 'Test User',
          status: 'active',
          access: 'active',
          language: 'pt-BR',
          country: 'BR',
          birthdate: null,
          gender: null,
          maritalStatus: null,
          pep: false,
          pepSince: null,
          fatherName: null,
          motherName: null,
          emailVerifiedAt: new Date(),
          phoneVerifiedAt: null,
          livenessVerifiedAt: null,
          onboardingState: { completedSteps: [], needsCorrection: [] },
          usersIdentities: [],
          usersAccounts: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        forceUpgrade: false,
        exchangeRates: null,
      };
      userProfileService.getCurrentUser.mockResolvedValue(response);

      const result = await controller.getCurrentUser(mockUser);

      expect(result).toEqual(response);
      expect(userProfileService.getCurrentUser).toHaveBeenCalledWith(mockUser.id, undefined);
    });

    it('should pass systemVersion to service', async () => {
      const response = {
        success: true,
        user: {
          ...mockUser,
          phone: null,
          firstName: 'Test',
          lastName: 'User',
          name: 'Test User',
          status: 'active',
          access: 'active',
          language: 'pt-BR',
          country: 'BR',
          birthdate: null,
          gender: null,
          maritalStatus: null,
          pep: false,
          pepSince: null,
          fatherName: null,
          motherName: null,
          emailVerifiedAt: new Date(),
          phoneVerifiedAt: null,
          livenessVerifiedAt: null,
          onboardingState: { completedSteps: [], needsCorrection: [] },
          usersIdentities: [],
          usersAccounts: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        forceUpgrade: true,
        exchangeRates: null,
      };
      const systemVersion = '1.0.0';
      userProfileService.getCurrentUser.mockResolvedValue(response);

      const result = await controller.getCurrentUser(mockUser, systemVersion);

      expect(result).toEqual(response);
      expect(userProfileService.getCurrentUser).toHaveBeenCalledWith(mockUser.id, systemVersion);
    });

    it('should propagate service errors', async () => {
      userProfileService.getCurrentUser.mockRejectedValue(new Error('User not found'));

      await expect(controller.getCurrentUser(mockUser)).rejects.toThrow('User not found');
    });
  });

  describe('email change', () => {
    it('requestEmailChange should delegate to emailChangeService', async () => {
      const dto = { newEmail: 'newemail@example.com' } as any;
      const response = {
        success: true,
        message: 'Email change requested',
        email: 'newemail@example.com',
        expiresIn: 3600,
      };
      emailChangeService.requestEmailChange.mockResolvedValue(response);

      const result = await controller.requestEmailChange(mockUser, dto);

      expect(result).toEqual(response);
      expect(emailChangeService.requestEmailChange).toHaveBeenCalledWith(mockUser.id, dto);
    });

    it('confirmEmailChange should delegate to emailChangeService', async () => {
      const dto = { code: '123456' } as any;
      const response = {
        success: true,
        message: 'Email changed successfully',
        email: 'newemail@example.com',
      };
      emailChangeService.confirmEmailChange.mockResolvedValue(response);

      const result = await controller.confirmEmailChange(mockUser, dto);

      expect(result).toEqual(response);
      expect(emailChangeService.confirmEmailChange).toHaveBeenCalledWith(mockUser.id, dto);
    });

    it('confirmEmailChange should propagate service errors', async () => {
      const dto = { code: 'invalid' } as any;
      emailChangeService.confirmEmailChange.mockRejectedValue(new Error('Invalid code'));

      await expect(controller.confirmEmailChange(mockUser, dto)).rejects.toThrow('Invalid code');
    });
  });

  describe('profile management', () => {
    it('updateAddress should delegate to userProfileService', async () => {
      const dto = { street: 'Main St', city: 'São Paulo', state: 'SP', zipCode: '01310-100' } as any;
      const response = {
        success: true,
        address: {
          zipCode: '01310-100',
          street: 'Main St',
          number: '100',
          neighborhood: null,
          city: 'São Paulo',
          state: 'SP',
          complement: null,
        },
      };
      userProfileService.updateAddress.mockResolvedValue(response);

      const result = await controller.updateAddress(mockUser, dto);

      expect(result).toEqual(response);
      expect(userProfileService.updateAddress).toHaveBeenCalledWith(mockUser.id, dto);
    });

    it('updateProfile should delegate to userProfileService', async () => {
      const dto = { firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' } as any;
      const response = {
        success: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: 'John',
          lastName: 'Doe',
          phone: null,
          name: 'John Doe',
          language: 'pt-BR',
          country: 'BR',
          birthdate: new Date('1990-01-01'),
          gender: null,
          maritalStatus: null,
          image: null,
        },
      };
      userProfileService.updateProfile.mockResolvedValue(response);

      const result = await controller.updateProfile(mockUser, dto);

      expect(result).toEqual(response);
      expect(userProfileService.updateProfile).toHaveBeenCalledWith(mockUser.id, dto);
    });

    it('updateProfile should propagate service errors', async () => {
      const dto = { firstName: '' } as any;
      userProfileService.updateProfile.mockRejectedValue(new Error('Invalid profile data'));

      await expect(controller.updateProfile(mockUser, dto)).rejects.toThrow('Invalid profile data');
    });
  });

  describe('password management', () => {
    it('changePassword should delegate to passwordService with metadata', async () => {
      const dto = { currentPassword: 'old123', newPassword: 'new456' } as any;
      const response = { success: true, message: 'Password changed successfully' };
      passwordService.changePassword.mockResolvedValue(response);

      const result = await controller.changePassword(mockUser, dto, mockFastifyRequest);

      expect(result).toEqual(response);
      expect(passwordService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        dto,
        expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      );
    });

    it('changePassword should extract IP from x-real-ip header if x-forwarded-for not present', async () => {
      const dto = { currentPassword: 'old123', newPassword: 'new456' } as any;
      const mockRequest = {
        headers: {
          'x-real-ip': '10.0.0.1',
          'user-agent': 'Mozilla/5.0',
        },
        socket: { remoteAddress: '127.0.0.1' },
      } as any;
      const response = { success: true, message: 'Password changed successfully' };
      passwordService.changePassword.mockResolvedValue(response);

      await controller.changePassword(mockUser, dto, mockRequest);

      expect(passwordService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        dto,
        expect.objectContaining({
          ipAddress: '10.0.0.1',
        }),
      );
    });
  });

  describe('session management', () => {
    it('signout should delegate to sessionService', async () => {
      const dto = { deviceId: 'device-123' } as any;
      const response = { accessToken: null };
      sessionService.signout.mockResolvedValue(response);

      const result = await controller.signout(mockUser, dto);

      expect(result).toEqual(response);
      expect(sessionService.signout).toHaveBeenCalledWith(mockUser.id, dto.deviceId);
    });

    it('signout should work without deviceId', async () => {
      const response = { accessToken: null };
      sessionService.signout.mockResolvedValue(response);

      const result = await controller.signout(mockUser);

      expect(result).toEqual(response);
      expect(sessionService.signout).toHaveBeenCalledWith(mockUser.id, undefined);
    });
  });

  describe('account closure', () => {
    it('closeAccount should delegate to accountClosureService', async () => {
      const dto = { reason: 'No longer needed', password: 'confirm123' } as any;
      const response = { accessToken: null };
      accountClosureService.closeAccount.mockResolvedValue(response);

      const result = await controller.closeAccount(mockUser, dto);

      expect(result).toEqual(response);
      expect(accountClosureService.closeAccount).toHaveBeenCalledWith(mockUser.id, dto);
    });

    it('closeAccount should propagate service errors', async () => {
      const dto = { reason: 'test' } as any;
      accountClosureService.closeAccount.mockRejectedValue(new Error('Cannot close account'));

      await expect(controller.closeAccount(mockUser, dto)).rejects.toThrow('Cannot close account');
    });
  });

  describe('biometric verification', () => {
    it('livenessCheck should delegate to livenessService', async () => {
      const dto = { videoData: 'base64encodedvideo' } as any;
      const response = {
        data: {
          text: 'Liveness verified',
          url: 'https://example.com/liveness-result',
        },
        next: null,
      };
      livenessService.livenessCheck.mockResolvedValue(response);

      const result = await controller.livenessCheck(mockUser, dto);

      expect(result).toEqual(response);
      expect(livenessService.livenessCheck).toHaveBeenCalledWith(mockUser.id, dto);
    });

    it('livenessCheck should handle failed verification', async () => {
      const dto = { videoData: 'base64encodedvideo' } as any;
      const response = {
        data: {
          text: 'Liveness check failed',
          url: 'https://example.com/liveness-failed',
        },
        next: null,
      };
      livenessService.livenessCheck.mockResolvedValue(response);

      const result = await controller.livenessCheck(mockUser, dto);

      expect(result.data).toBeDefined();
      expect(result.data.text).toBeDefined();
    });
  });

  describe('onboarding', () => {
    it('onboarding should delegate to onboardingStatusService', async () => {
      const response = {
        message: 'Onboarding processing',
        onboardingState: { completedSteps: [], needsCorrection: [] },
        nextStep: 'identity_verification',
      };
      onboardingStatusService.onboarding.mockResolvedValue(response);

      const result = await controller.onboarding(mockUser);

      expect(result).toEqual(response);
      expect(onboardingStatusService.onboarding).toHaveBeenCalledWith(mockUser.id, undefined);
    });

    it('onboarding should pass step parameter to service', async () => {
      const step = 'document_verification';
      const response = {
        message: 'Step processing',
        onboardingState: { completedSteps: ['identity_verification'], needsCorrection: [] },
        nextStep: 'payment_method',
      };
      onboardingStatusService.onboarding.mockResolvedValue(response);

      const result = await controller.onboarding(mockUser, step);

      expect(result).toEqual(response);
      expect(onboardingStatusService.onboarding).toHaveBeenCalledWith(mockUser.id, step);
    });
  });

  describe('messaging', () => {
    it('sendMessage should delegate to messagingService', async () => {
      const dto = { message: 'Test message', recipientId: 'recipient-123' } as any;
      const response = { message: 'Message sent', messageId: 'msg-123' };
      messagingService.sendMessage.mockResolvedValue(response);

      const result = await controller.sendMessage(mockUser, dto);

      expect(result).toEqual(response);
      expect(messagingService.sendMessage).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('identity management', () => {
    it('getUserIdentities should delegate to identityService', async () => {
      const userId = 'user-123';
      const response = {
        identities: [
          {
            id: 'identity-1',
            country: 'BR',
            taxDocumentNumber: '12345678901',
            taxDocumentType: 'CPF',
            identityDocumentNumber: '1234567',
            identityDocumentType: 'RG',
            status: 'verified',
            createdAt: new Date(),
          },
        ],
      };
      identityService.getUserIdentities.mockResolvedValue(response);

      const result = await controller.getUserIdentities(mockUser, userId);

      expect(result).toEqual(response);
      expect(identityService.getUserIdentities).toHaveBeenCalledWith(userId);
    });

    it('getUserIdentities should throw ForbiddenException if user id does not match', async () => {
      const differentUserId = 'user-456';

      await expect(controller.getUserIdentities(mockUser, differentUserId)).rejects.toThrow(ForbiddenException);
    });

    it('setDefaultIdentity should delegate to identityService', async () => {
      const identityId = 'identity-123';
      const response = { message: 'Default identity set' };
      identityService.setDefaultIdentity.mockResolvedValue(response);

      const result = await controller.setDefaultIdentity(mockUser, identityId);

      expect(result).toEqual(response);
      expect(identityService.setDefaultIdentity).toHaveBeenCalledWith(mockUser.id, { identityId });
    });
  });

  describe('account management', () => {
    it('setDefaultAccount should delegate to accountService', async () => {
      const accountId = 'account-123';
      const response = { message: 'Default account set' };
      accountService.setDefaultAccount.mockResolvedValue(response);

      const result = await controller.setDefaultAccount(mockUser, accountId);

      expect(result).toEqual(response);
      expect(accountService.setDefaultAccount).toHaveBeenCalledWith(mockUser.id, { accountId });
    });

    it('setUserAccountAlias should delegate to accountService', async () => {
      const accountId = 'account-123';
      const dto = { alias: 'My Savings Account' } as any;
      const response = { message: 'Alias updated' };
      accountService.setUserAccountAlias.mockResolvedValue(response);

      const result = await controller.setUserAccountAlias(mockUser, accountId, dto);

      expect(result).toEqual(response);
      expect(accountService.setUserAccountAlias).toHaveBeenCalledWith(mockUser.id, accountId, dto.alias);
    });

    it('getAccountBalances should delegate to accountService', async () => {
      const response = {
        accounts: [
          {
            id: 'acc-1',
            type: 'checking',
            currency: 'BRL',
            balance: '1000.00',
            alias: null,
            status: 'active',
          },
        ],
      };
      accountService.getAccountBalances.mockResolvedValue(response);

      const result = await controller.getAccountBalances(mockUser);

      expect(result).toEqual(response);
      expect(accountService.getAccountBalances).toHaveBeenCalledWith(mockUser.id);
    });

    it('getUserAccountInfo should delegate to accountService', async () => {
      const accountId = 'account-123';
      const response = { account: { id: accountId, type: 'checking', balance: 5000 } };
      accountService.getUserAccountInfo.mockResolvedValue(response);

      const result = await controller.getUserAccountInfo(accountId);

      expect(result).toEqual(response);
      expect(accountService.getUserAccountInfo).toHaveBeenCalledWith(accountId);
    });

    it('getSailpointInfo should return hardcoded response', async () => {
      const sailpointId = 'sailpoint-123';

      const result = await controller.getSailpointInfo(sailpointId);

      expect(result).toEqual({ message: 'Sailpoint info retrieved' });
    });
  });
});
