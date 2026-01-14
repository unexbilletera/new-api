import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnboardingController,
  UserOnboardingController,
} from '../../../../../../src/public/onboarding/controllers/onboarding.controller';
import { UserOnboardingService } from '../../../../../../src/public/onboarding/services/user-onboarding.service';
import { VerificationService } from '../../../../../../src/public/onboarding/services/verification.service';
import { IdentityOnboardingService } from '../../../../../../src/public/onboarding/services/identity-onboarding.service';
import { EmailValidationOnboardingService } from '../../../../../../src/public/onboarding/services/email-validation-onboarding.service';
import { PhoneValidationService } from '../../../../../../src/public/auth/services/phone-validation.service';
import { JwtAuthGuard } from '../../../../../../src/shared/guards/jwt-auth.guard';

describe('OnboardingController', () => {
  let controller: OnboardingController;
  let userController: UserOnboardingController;
  let userOnboardingService: jest.Mocked<UserOnboardingService>;
  let verificationService: jest.Mocked<VerificationService>;
  let identityOnboardingService: jest.Mocked<IdentityOnboardingService>;
  let emailValidationService: jest.Mocked<EmailValidationOnboardingService>;
  let phoneValidationService: jest.Mocked<PhoneValidationService>;

  const mockUserId = 'user-123';
  const mockIdentityId = 'identity-456';
  const mockUserIdentityId = 'user-identity-789';

  beforeEach(async () => {
    userOnboardingService = {
      startUserOnboarding: jest.fn(),
      updateUserOnboarding: jest.fn(),
    } as unknown as jest.Mocked<UserOnboardingService>;

    verificationService = {
      verifyOnboardingCode: jest.fn(),
    } as unknown as jest.Mocked<VerificationService>;

    identityOnboardingService = {
      startIdentityOnboarding: jest.fn(),
      updateIdentityOnboarding: jest.fn(),
      uploadArgentinaDocument: jest.fn(),
      getOnboardingPendingData: jest.fn(),
      updateOnboardingSpecificData: jest.fn(),
      getOnboardingStatus: jest.fn(),
      validateOnboardingData: jest.fn(),
      retryOnboarding: jest.fn(),
    } as unknown as jest.Mocked<IdentityOnboardingService>;

    emailValidationService = {
      sendEmailValidation: jest.fn(),
    } as unknown as jest.Mocked<EmailValidationOnboardingService>;

    phoneValidationService = {
      sendPhoneValidation: jest.fn(),
    } as unknown as jest.Mocked<PhoneValidationService>;

    const mockJwtService = {
      sign: jest.fn(),
      signAsync: jest.fn(),
      verify: jest.fn(),
      verifyAsync: jest.fn(),
      decode: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    const mockAuthGuard: CanActivate = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingController, UserOnboardingController],
      providers: [
        { provide: UserOnboardingService, useValue: userOnboardingService },
        { provide: VerificationService, useValue: verificationService },
        {
          provide: IdentityOnboardingService,
          useValue: identityOnboardingService,
        },
        {
          provide: EmailValidationOnboardingService,
          useValue: emailValidationService,
        },
        { provide: PhoneValidationService, useValue: phoneValidationService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: JwtAuthGuard, useValue: mockAuthGuard },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get(OnboardingController);
    userController = module.get(UserOnboardingController);
  });

  describe('user onboarding initialization', () => {
    it('startUserOnboarding should delegate to service', async () => {
      const dto = { email: 'test@example.com' };
      const payload = {
        success: true,
        message: 'Onboarding started',
        userId: mockUserId,
        onboardingState: { completedSteps: [], needsCorrection: [] },
        nextStep: 'emailForm',
      };
      userOnboardingService.startUserOnboarding.mockResolvedValue(payload);

      const result = await controller.startUserOnboarding(dto);

      expect(result).toEqual(payload);
      expect(userOnboardingService.startUserOnboarding).toHaveBeenCalledWith(
        dto,
      );
    });

    it('startUserOnboarding should return onboarding state', async () => {
      const dto = { email: 'test@example.com' };
      const payload = {
        success: true,
        message: 'Onboarding started',
        userId: mockUserId,
        onboardingState: { completedSteps: [], needsCorrection: [] },
        nextStep: 'emailForm',
      };
      userOnboardingService.startUserOnboarding.mockResolvedValue(payload);

      const result = await controller.startUserOnboarding(dto);

      expect(result.userId).toBeDefined();
      expect(result.onboardingState).toBeDefined();
    });

    it('startUserOnboarding should propagate service errors', async () => {
      const dto = { email: 'invalid' };
      userOnboardingService.startUserOnboarding.mockRejectedValue(
        new Error('Invalid email'),
      );

      await expect(controller.startUserOnboarding(dto)).rejects.toThrow(
        'Invalid email',
      );
    });
  });

  describe('verification', () => {
    it('verifyCode should delegate to service', async () => {
      const dto = {
        email: 'test@example.com',
        code: '123456',
        type: 'email' as const,
      };
      const payload = {
        success: true,
        message: 'Code verified successfully',
        userId: mockUserId,
        onboardingState: {
          completedSteps: ['email_verification'],
          needsCorrection: [],
        },
        nextStep: 'phoneForm',
      };
      verificationService.verifyOnboardingCode.mockResolvedValue(payload);

      const result = await controller.verifyCode(dto);

      expect(result).toEqual(payload);
      expect(verificationService.verifyOnboardingCode).toHaveBeenCalledWith(
        dto,
      );
    });

    it('verifyCode should update onboarding state', async () => {
      const dto = {
        email: 'test@example.com',
        code: '123456',
        type: 'email' as const,
      };
      const payload = {
        success: true,
        message: 'Code verified successfully',
        userId: mockUserId,
        onboardingState: {
          completedSteps: ['email_verification'],
          needsCorrection: [],
        },
        nextStep: 'phoneForm',
      };
      verificationService.verifyOnboardingCode.mockResolvedValue(payload);

      const result = await controller.verifyCode(dto);

      expect(result.onboardingState.completedSteps).toContain(
        'email_verification',
      );
    });

    it('verifyCode should propagate service errors', async () => {
      const dto = {
        email: 'test@example.com',
        code: 'invalid',
        type: 'email' as const,
      };
      verificationService.verifyOnboardingCode.mockRejectedValue(
        new Error('Invalid code'),
      );

      await expect(controller.verifyCode(dto)).rejects.toThrow('Invalid code');
    });
  });

  describe('validation channel selection', () => {
    it('sendEmailValidation should delegate to auth service', async () => {
      const dto = { email: 'test@example.com' };
      const payload = { message: 'Validation code sent', debug: '123' };
      emailValidationService.sendEmailValidation.mockResolvedValue(payload);

      const result = await controller.sendEmailValidation(dto);

      expect(result).toEqual(payload);
      expect(emailValidationService.sendEmailValidation).toHaveBeenCalledWith(
        dto,
      );
    });

    it('sendPhoneValidation should delegate to auth service', async () => {
      const dto = { phone: '+5511999999999' };
      const payload = { message: 'Validation code sent', debug: '456' };
      phoneValidationService.sendPhoneValidation.mockResolvedValue(payload);

      const result = await controller.sendPhoneValidation(dto);

      expect(result).toEqual(payload);
      expect(phoneValidationService.sendPhoneValidation).toHaveBeenCalledWith(
        dto,
      );
    });
  });

  describe('user data management', () => {
    it('updateUserData should delegate to service', async () => {
      const dto = { firstName: 'John', lastName: 'Doe' };
      const payload = {
        success: true,
        message: 'Data updated successfully',
        user: {
          id: mockUserId,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        onboardingState: { completedSteps: [], needsCorrection: [] },
      };
      userOnboardingService.updateUserOnboarding.mockResolvedValue(payload);

      const result = await controller.updateUserData(mockUserId, dto);

      expect(result).toEqual(payload);
      expect(userOnboardingService.updateUserOnboarding).toHaveBeenCalledWith(
        mockUserId,
        dto,
      );
    });

    it('updateUserData should propagate service errors', async () => {
      const dto = { firstName: '' };
      userOnboardingService.updateUserOnboarding.mockRejectedValue(
        new Error('Invalid data'),
      );

      await expect(controller.updateUserData(mockUserId, dto)).rejects.toThrow(
        'Invalid data',
      );
    });
  });

  describe('identity onboarding', () => {
    it('startIdentityOnboarding should delegate to service', async () => {
      const dto = { documentType: 'CPF', countryCode: 'BR' };
      const payload = {
        message: 'Identity onboarding started',
        identityId: mockIdentityId,
      };
      identityOnboardingService.startIdentityOnboarding.mockResolvedValue(
        payload,
      );

      const result = await controller.startIdentityOnboarding(mockUserId, dto);

      expect(result).toEqual(payload);
      expect(
        identityOnboardingService.startIdentityOnboarding,
      ).toHaveBeenCalledWith(mockUserId, dto);
    });

    it('updateIdentity should delegate to service', async () => {
      const dto = { firstName: 'John', documentNumber: '12345678900' };
      const payload = {
        message: 'Identity updated successfully',
        identityId: mockIdentityId,
      };
      identityOnboardingService.updateIdentityOnboarding.mockResolvedValue(
        payload,
      );

      const result = await controller.updateIdentity(mockIdentityId, dto);

      expect(result).toEqual(payload);
      expect(
        identityOnboardingService.updateIdentityOnboarding,
      ).toHaveBeenCalledWith(mockIdentityId, dto);
    });

    it('uploadArgentinaDocument should delegate to service', async () => {
      const dto = {
        userId: mockUserId,
        identityId: mockIdentityId,
        frontImage: 'base64-front-image',
        backImage: 'base64-back-image',
        pdf417Data: {
          documentNumber: '12345678',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          gender: 'M',
        },
      };
      const payload = {
        message: 'Document uploaded successfully',
        onboardingState: {
          completedSteps: ['document_upload'],
          needsCorrection: [],
        },
      };
      identityOnboardingService.uploadArgentinaDocument.mockResolvedValue(
        payload,
      );

      const result = await controller.uploadArgentinaDocument(dto);

      expect(result).toEqual(payload);
      expect(
        identityOnboardingService.uploadArgentinaDocument,
      ).toHaveBeenCalledWith(mockUserId, mockIdentityId, dto);
    });
  });

  describe('onboarding status and validation', () => {
    it('getPendingData should delegate to service', async () => {
      const payload = {
        pendingFields: ['firstName', 'lastName'],
        needsCorrection: [],
      };
      identityOnboardingService.getOnboardingPendingData.mockResolvedValue(
        payload,
      );

      const result = await userController.getPendingData(mockUserIdentityId);

      expect(result).toEqual(payload);
      expect(
        identityOnboardingService.getOnboardingPendingData,
      ).toHaveBeenCalledWith(mockUserIdentityId);
    });

    it('getPendingData should list fields requiring attention', async () => {
      const payload = {
        pendingFields: ['firstName', 'dateOfBirth'],
        needsCorrection: ['address'],
      };
      identityOnboardingService.getOnboardingPendingData.mockResolvedValue(
        payload,
      );

      const result = await userController.getPendingData(mockUserIdentityId);

      expect(Array.isArray(result.pendingFields)).toBe(true);
      expect(Array.isArray(result.needsCorrection)).toBe(true);
    });

    it('updateSpecificData should delegate to service', async () => {
      const dto = { documentNumber: '12345678' };
      const payload = { message: 'Onboarding data updated' };
      identityOnboardingService.updateOnboardingSpecificData.mockResolvedValue(
        payload,
      );

      const result = await userController.updateSpecificData(
        mockUserIdentityId,
        dto,
      );

      expect(result).toEqual(payload);
      expect(
        identityOnboardingService.updateOnboardingSpecificData,
      ).toHaveBeenCalledWith(mockUserIdentityId, dto);
    });

    it('getStatus should delegate to service', async () => {
      const payload = {
        status: 'pending' as const,
        completionPercentage: 50,
        pendingSteps: ['identity_verification'],
      };
      identityOnboardingService.getOnboardingStatus.mockResolvedValue(payload);

      const result = await userController.getStatus(mockUserIdentityId);

      expect(result).toEqual(payload);
      expect(
        identityOnboardingService.getOnboardingStatus,
      ).toHaveBeenCalledWith(mockUserIdentityId);
    });

    it('getStatus should return completion percentage', async () => {
      const payload = {
        status: 'pending' as const,
        completionPercentage: 75,
        pendingSteps: ['document_verification'],
      };
      identityOnboardingService.getOnboardingStatus.mockResolvedValue(payload);

      const result = await userController.getStatus(mockUserIdentityId);

      expect(result.completionPercentage).toEqual(75);
      expect(result.status).toBeDefined();
    });

    it('validate should delegate to service', async () => {
      const payload = { isValid: true, errors: [] };
      identityOnboardingService.validateOnboardingData.mockResolvedValue(
        payload,
      );

      const result = await userController.validate(mockUserIdentityId);

      expect(result).toEqual(payload);
      expect(
        identityOnboardingService.validateOnboardingData,
      ).toHaveBeenCalledWith(mockUserIdentityId);
    });

    it('validate should return validation errors if invalid', async () => {
      const payload = {
        isValid: false,
        errors: ['Missing firstName', 'Invalid email'],
      };
      identityOnboardingService.validateOnboardingData.mockResolvedValue(
        payload,
      );

      const result = await userController.validate(mockUserIdentityId);

      expect(result.isValid).toBe(false);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('onboarding retry', () => {
    it('retry should delegate to service', async () => {
      const payload = { message: 'Onboarding data resubmitted' };
      identityOnboardingService.retryOnboarding.mockResolvedValue(payload);

      const result = await userController.retry(mockUserIdentityId);

      expect(result).toEqual(payload);
      expect(identityOnboardingService.retryOnboarding).toHaveBeenCalledWith(
        mockUserIdentityId,
      );
    });

    it('retry should propagate service errors', async () => {
      identityOnboardingService.retryOnboarding.mockRejectedValue(
        new Error('Retry failed'),
      );

      await expect(userController.retry(mockUserIdentityId)).rejects.toThrow(
        'Retry failed',
      );
    });
  });
});
