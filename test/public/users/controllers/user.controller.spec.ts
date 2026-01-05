import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../../../../src/public/users/controllers/user.controller';
import { UserService } from '../../../../src/public/users/services/user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;

  beforeEach(async () => {
    service = {
      getCurrentUser: jest.fn(),
      updateProfile: jest.fn(),
      signout: jest.fn(),
      closeAccount: jest.fn(),
      livenessCheck: jest.fn(),
      onboarding: jest.fn(),
      sendMessage: jest.fn(),
      getUserIdentities: jest.fn(),
      setDefaultIdentity: jest.fn(),
      setDefaultAccount: jest.fn(),
      setUserAccountAlias: jest.fn(),
      getAccountBalances: jest.fn(),
      getUserAccountInfo: jest.fn(),
      getSailpointInfo: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: service }],
    }).compile();

    controller = module.get(UserController);
  });

  it('getCurrentUser delegates to service', async () => {
    const payload = { user: { id: '1' }, forceUpgrade: false, exchangeRates: null } as any;
    service.getCurrentUser.mockResolvedValue(payload);
    await expect(controller.getCurrentUser()).resolves.toEqual(payload);
    expect(service.getCurrentUser).toHaveBeenCalledWith('userId', undefined);
  });

  it('getCurrentUser passes systemVersion to service', async () => {
    const payload = { user: { id: '1' }, forceUpgrade: true, exchangeRates: null } as any;
    service.getCurrentUser.mockResolvedValue(payload);
    await expect(controller.getCurrentUser('1.0.0')).resolves.toEqual(payload);
    expect(service.getCurrentUser).toHaveBeenCalledWith('userId', '1.0.0');
  });

  it('updateProfile delegates to service', async () => {
    const dto = {} as any;
    const payload = { user: { id: '1' } } as any;
    service.updateProfile.mockResolvedValue(payload);
    await expect(controller.updateProfile(dto)).resolves.toEqual(payload);
    expect(service.updateProfile).toHaveBeenCalledWith('userId', dto);
  });

  it('signout delegates to service', async () => {
    const dto = {} as any;
    const payload = { accessToken: null };
    service.signout.mockResolvedValue(payload);
    await expect(controller.signout(dto)).resolves.toEqual(payload);
    expect(service.signout).toHaveBeenCalledWith('userId', dto.deviceId);
  });

  it('closeAccount delegates to service', async () => {
    const dto = {} as any;
    const payload = { accessToken: null };
    service.closeAccount.mockResolvedValue(payload);
    await expect(controller.closeAccount(dto)).resolves.toEqual(payload);
    expect(service.closeAccount).toHaveBeenCalledWith('userId', dto);
  });

  it('livenessCheck delegates to service', async () => {
    const dto = {} as any;
    const payload = { isLive: true, confidence: 0.95, message: 'Liveness check passed' };
    service.livenessCheck.mockResolvedValue(payload);
    await expect(controller.livenessCheck(dto)).resolves.toEqual(payload);
    expect(service.livenessCheck).toHaveBeenCalledWith('userId', dto);
  });

  it('onboarding delegates to service', async () => {
    const payload = { message: 'Onboarding data processed', onboardingState: {}, nextStep: 'identity_verification' };
    service.onboarding.mockResolvedValue(payload);
    await expect(controller.onboarding(undefined)).resolves.toEqual(payload);
    expect(service.onboarding).toHaveBeenCalledWith('userId', undefined);
  });

  it('sendMessage delegates to service', async () => {
    const dto = {} as any;
    const payload = { message: 'Message sent successfully' };
    service.sendMessage.mockResolvedValue(payload);
    await expect(controller.sendMessage(dto)).resolves.toEqual(payload);
    expect(service.sendMessage).toHaveBeenCalledWith('userId', dto);
  });

  it('getUserIdentities delegates to service', async () => {
    const payload = { identities: [] };
    service.getUserIdentities.mockResolvedValue(payload);
    await expect(controller.getUserIdentities('uid')).resolves.toEqual(payload);
    expect(service.getUserIdentities).toHaveBeenCalledWith('uid');
  });

  it('setDefaultIdentity delegates to service', async () => {
    const payload = { message: 'Default identity set' };
    service.setDefaultIdentity.mockResolvedValue(payload);
    await expect(controller.setDefaultIdentity('id')).resolves.toEqual(payload);
    expect(service.setDefaultIdentity).toHaveBeenCalledWith('userId', { identityId: 'id' });
  });

  it('setDefaultAccount delegates to service', async () => {
    const payload = { message: 'Default account set' };
    service.setDefaultAccount.mockResolvedValue(payload);
    await expect(controller.setDefaultAccount('id')).resolves.toEqual(payload);
    expect(service.setDefaultAccount).toHaveBeenCalledWith('userId', { accountId: 'id' });
  });

  it('setUserAccountAlias delegates to service', async () => {
    const dto = { alias: 'a' } as any;
    const payload = { message: 'Account alias updated' };
    service.setUserAccountAlias.mockResolvedValue(payload);
    await expect(controller.setUserAccountAlias('id', dto)).resolves.toEqual(payload);
    expect(service.setUserAccountAlias).toHaveBeenCalledWith('userId', 'id', dto.alias);
  });

  it('getAccountBalances delegates to service', async () => {
    const payload = { accounts: [] };
    service.getAccountBalances.mockResolvedValue(payload);
    await expect(controller.getAccountBalances()).resolves.toEqual(payload);
    expect(service.getAccountBalances).toHaveBeenCalledWith('userId');
  });

  it('getUserAccountInfo delegates to service', async () => {
    const payload = { account: { id: 'id', type: 'checking', currency: 'BRL', balance: 0 } };
    service.getUserAccountInfo.mockResolvedValue(payload);
    await expect(controller.getUserAccountInfo('id')).resolves.toEqual(payload);
    expect(service.getUserAccountInfo).toHaveBeenCalledWith('id');
  });

  it('getSailpointInfo delegates to service', async () => {
    const payload = { message: 'Sailpoint info retrieved' };
    service.getSailpointInfo.mockResolvedValue(payload);
    await expect(controller.getSailpointInfo('id')).resolves.toEqual(payload);
    expect(service.getSailpointInfo).toHaveBeenCalledWith('id');
  });
});
