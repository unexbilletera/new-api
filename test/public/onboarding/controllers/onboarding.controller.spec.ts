import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingController, UserOnboardingController } from '../../../../src/public/onboarding/controllers/onboarding.controller';
import { OnboardingService } from '../../../../src/public/onboarding/services/onboarding.service';
import { AuthService } from '../../../../src/public/auth/services/auth.service';

describe('OnboardingController', () => {
  let controller: OnboardingController;
  let userController: UserOnboardingController;
  let onboardingService: jest.Mocked<OnboardingService>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    onboardingService = {
      startUserOnboarding: jest.fn(),
      verifyOnboardingCode: jest.fn(),
      updateUserOnboarding: jest.fn(),
      startIdentityOnboarding: jest.fn(),
      updateIdentityOnboarding: jest.fn(),
      uploadArgentinaDocument: jest.fn(),
      getOnboardingPendingData: jest.fn(),
      updateOnboardingSpecificData: jest.fn(),
      getOnboardingStatus: jest.fn(),
      validateOnboardingData: jest.fn(),
      retryOnboarding: jest.fn(),
    } as unknown as jest.Mocked<OnboardingService>;

    authService = {
      sendEmailValidation: jest.fn(),
      sendPhoneValidation: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingController, UserOnboardingController],
      providers: [
        { provide: OnboardingService, useValue: onboardingService },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    controller = module.get(OnboardingController);
    userController = module.get(UserOnboardingController);
  });

  it('startUserOnboarding delegates to service', async () => {
    const dto = {} as any;
    const payload = { message: 'Onboarding started', userId: 'u1', onboardingState: { completedSteps: [], needsCorrection: [] } };
    onboardingService.startUserOnboarding.mockResolvedValue(payload);
    await expect(controller.startUserOnboarding(dto)).resolves.toEqual(payload);
    expect(onboardingService.startUserOnboarding).toHaveBeenCalledWith(dto);
  });

  it('verifyCode delegates to service', async () => {
    const dto = {} as any;
    const payload = { message: 'Code verified successfully', userId: 'u1', onboardingState: { completedSteps: [], needsCorrection: [] } };
    onboardingService.verifyOnboardingCode.mockResolvedValue(payload);
    await expect(controller.verifyCode(dto)).resolves.toEqual(payload);
    expect(onboardingService.verifyOnboardingCode).toHaveBeenCalledWith(dto);
  });

  it('sendEmailValidation delegates to auth service', async () => {
    const dto = {} as any;
    const payload = { message: 'sent', debug: '123' };
    authService.sendEmailValidation.mockResolvedValue(payload);
    await expect(controller.sendEmailValidation(dto)).resolves.toEqual(payload);
    expect(authService.sendEmailValidation).toHaveBeenCalledWith(dto);
  });

  it('sendPhoneValidation delegates to auth service', async () => {
    const dto = {} as any;
    const payload = { message: 'sent', debug: '456' };
    authService.sendPhoneValidation.mockResolvedValue(payload);
    await expect(controller.sendPhoneValidation(dto)).resolves.toEqual(payload);
    expect(authService.sendPhoneValidation).toHaveBeenCalledWith(dto);
  });

  it('updateUserData delegates to service', async () => {
    const dto = {} as any;
    const payload = { user: { id: 'uid' } } as any;
    onboardingService.updateUserOnboarding.mockResolvedValue(payload);
    await expect(controller.updateUserData('uid', dto)).resolves.toEqual(payload);
    expect(onboardingService.updateUserOnboarding).toHaveBeenCalledWith('uid', dto);
  });

  it('startIdentityOnboarding delegates to service', async () => {
    const dto = {} as any;
    const payload = { message: 'Identity onboarding started', identityId: 'i1' };
    onboardingService.startIdentityOnboarding.mockResolvedValue(payload);
    await expect(controller.startIdentityOnboarding('uid', dto)).resolves.toEqual(payload);
    expect(onboardingService.startIdentityOnboarding).toHaveBeenCalledWith('uid', dto);
  });

  it('updateIdentity delegates to service', async () => {
    const dto = {} as any;
    const payload = { message: 'Identity updated successfully', identityId: 'iid' };
    onboardingService.updateIdentityOnboarding.mockResolvedValue(payload);
    await expect(controller.updateIdentity('iid', dto)).resolves.toEqual(payload);
    expect(onboardingService.updateIdentityOnboarding).toHaveBeenCalledWith('iid', dto);
  });

  it('uploadArgentinaDocument delegates to service', async () => {
    const dto = { userId: 'u', identityId: 'i' } as any;
    const payload = { message: 'Document uploaded successfully', onboardingState: { completedSteps: [], needsCorrection: [] } };
    onboardingService.uploadArgentinaDocument.mockResolvedValue(payload);
    await expect(controller.uploadArgentinaDocument(dto)).resolves.toEqual(payload);
    expect(onboardingService.uploadArgentinaDocument).toHaveBeenCalledWith('u', 'i', dto);
  });

  it('getPendingData delegates to service', async () => {
    const payload = { pendingFields: [], needsCorrection: [] };
    onboardingService.getOnboardingPendingData.mockResolvedValue(payload);
    await expect(userController.getPendingData('id')).resolves.toEqual(payload);
    expect(onboardingService.getOnboardingPendingData).toHaveBeenCalledWith('id');
  });

  it('updateSpecificData delegates to service', async () => {
    const dto = { field: 'x' };
    const payload = { message: 'Onboarding data updated' };
    onboardingService.updateOnboardingSpecificData.mockResolvedValue(payload);
    await expect(userController.updateSpecificData('id', dto)).resolves.toEqual(payload);
    expect(onboardingService.updateOnboardingSpecificData).toHaveBeenCalledWith('id', dto);
  });

  it('getStatus delegates to service', async () => {
    const payload = { status: 'pending', completionPercentage: 50, pendingSteps: ['1'] };
    onboardingService.getOnboardingStatus.mockResolvedValue(payload);
    await expect(userController.getStatus('id')).resolves.toEqual(payload);
    expect(onboardingService.getOnboardingStatus).toHaveBeenCalledWith('id');
  });

  it('validate delegates to service', async () => {
    const payload = { isValid: true, errors: [] };
    onboardingService.validateOnboardingData.mockResolvedValue(payload);
    await expect(userController.validate('id')).resolves.toEqual(payload);
    expect(onboardingService.validateOnboardingData).toHaveBeenCalledWith('id');
  });

  it('retry delegates to service', async () => {
    const payload = { message: 'Onboarding data resubmitted' };
    onboardingService.retryOnboarding.mockResolvedValue(payload);
    await expect(userController.retry('id')).resolves.toEqual(payload);
    expect(onboardingService.retryOnboarding).toHaveBeenCalledWith('id');
  });
});
