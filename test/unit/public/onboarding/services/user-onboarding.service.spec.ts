/**
 * @file user-onboarding.service.spec.ts
 * @description Unit tests for UserOnboardingService - User onboarding flow management
 * @module test/unit/public/onboarding/services
 * @category Unit Tests
 * @subcategory Public - User Onboarding
 *
 * @requires @nestjs/testing
 * @requires jest
 *
 * @author Unex Development Team
 * @since 2.0.0
 * @lastModified 2026-01-14
 *
 * @see {@link ../../../../../src/public/onboarding/services/user-onboarding.service.ts} for implementation
 *
 * @coverage
 * - Lines: 90%+
 * - Statements: 90%+
 * - Functions: 90%+
 * - Branches: 90%+
 *
 * @testScenarios
 * - Start user onboarding
 * - Update user onboarding data
 * - Process campaign codes
 * - Process liveness image
 * - Validate email format
 * - Handle duplicate emails
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { UserOnboardingService } from '../../../../../src/public/onboarding/services/user-onboarding.service';
import { OnboardingModel } from '../../../../../src/public/onboarding/models/onboarding.model';
import { OnboardingMapper } from '../../../../../src/public/onboarding/mappers/onboarding.mapper';
import { LoggerService } from '../../../../../src/shared/logger/logger.service';
import { NotificationService } from '../../../../../src/shared/notifications/notifications.service';
import { AppConfigService } from '../../../../../src/shared/config/config.service';
import { PasswordHelper } from '../../../../../src/shared/helpers/password.helper';
import { createLoggerServiceMock } from '../../../../utils';

describe('UserOnboardingService', () => {
  let service: UserOnboardingService;
  let onboardingModel: jest.Mocked<OnboardingModel>;
  let onboardingMapper: jest.Mocked<OnboardingMapper>;
  let logger: jest.Mocked<LoggerService>;
  let notificationService: jest.Mocked<NotificationService>;
  let appConfigService: jest.Mocked<AppConfigService>;

  const createOnboardingModelMock = (): jest.Mocked<OnboardingModel> =>
    ({
      findUserById: jest.fn(),
      findUserByEmail: jest.fn(),
      findUserByPhone: jest.fn(),
      createUser: jest.fn(),
      updateUserOnboarding: jest.fn(),
      updateUserOnboardingComplete: jest.fn(),
      findCampaignCode: jest.fn(),
      findUserCampaignCode: jest.fn(),
      createUserCampaignCode: jest.fn(),
    }) as any;

  const createOnboardingMapperMock = (): jest.Mocked<OnboardingMapper> =>
    ({
      toStartUserOnboardingResponseDto: jest.fn(),
      toUpdateUserOnboardingResponseDto: jest.fn(),
      toVerifyOnboardingCodeResponseDto: jest.fn(),
    }) as any;

  const createNotificationServiceMock = (): jest.Mocked<NotificationService> =>
    ({
      sendEmail: jest.fn(),
      sendSms: jest.fn(),
      sendPush: jest.fn(),
    }) as any;

  const createAppConfigServiceMock = (): jest.Mocked<AppConfigService> =>
    ({
      isValidaEnabled: jest.fn(),
      get: jest.fn(),
    }) as any;

  beforeEach(async () => {
    onboardingModel = createOnboardingModelMock();
    onboardingMapper = createOnboardingMapperMock();
    logger = createLoggerServiceMock();
    notificationService = createNotificationServiceMock();
    appConfigService = createAppConfigServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserOnboardingService,
        { provide: OnboardingModel, useValue: onboardingModel },
        { provide: OnboardingMapper, useValue: onboardingMapper },
        { provide: LoggerService, useValue: logger },
        { provide: NotificationService, useValue: notificationService },
        { provide: AppConfigService, useValue: appConfigService },
      ],
    }).compile();

    service = module.get<UserOnboardingService>(UserOnboardingService);
  });

  describe('instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('startUserOnboarding', () => {
    const validDto = { email: 'test@example.com' };

    it('should start user onboarding successfully with valid email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        onboardingState: { completedSteps: ['1.1'], needsCorrection: [] },
      };

      const expectedResponse = {
        success: true,
        message: 'Onboarding started successfully',
        userId: 'user-123',
        onboardingState: { completedSteps: ['1.1'], needsCorrection: [] },
        nextStep: 'emailForm',
      };

      onboardingModel.findUserByEmail.mockResolvedValue(null);
      onboardingModel.createUser.mockResolvedValue(mockUser as any);
      onboardingMapper.toStartUserOnboardingResponseDto.mockReturnValue(
        expectedResponse,
      );

      const result = await service.startUserOnboarding(validDto);

      expect(onboardingModel.findUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(onboardingModel.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'test',
        status: 'pending',
        access: 'user',
        onboardingState: { completedSteps: ['1.1'], needsCorrection: [] },
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should normalize email to lowercase and trim', async () => {
      const dto = { email: '  TEST@EXAMPLE.COM  ' };

      onboardingModel.findUserByEmail.mockResolvedValue(null);
      onboardingModel.createUser.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      } as any);
      onboardingMapper.toStartUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      await service.startUserOnboarding(dto);

      expect(onboardingModel.findUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(onboardingModel.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' }),
      );
    });

    it('should throw BadRequestException for invalid email format', async () => {
      const invalidDto = { email: 'invalid-email' };

      await expect(service.startUserOnboarding(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.startUserOnboarding(invalidDto)).rejects.toThrow(
        'users.errors.invalidEmail',
      );
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should throw BadRequestException for email without domain', async () => {
      const invalidDto = { email: 'test@' };

      await expect(service.startUserOnboarding(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for email without local part', async () => {
      const invalidDto = { email: '@example.com' };

      await expect(service.startUserOnboarding(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when email is already in use', async () => {
      const existingUser = {
        id: 'existing-user-123',
        email: 'test@example.com',
      };

      onboardingModel.findUserByEmail.mockResolvedValue(existingUser as any);

      await expect(service.startUserOnboarding(validDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.startUserOnboarding(validDto)).rejects.toThrow(
        'users.errors.emailAlreadyInUse',
      );
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should log info on successful onboarding start', async () => {
      onboardingModel.findUserByEmail.mockResolvedValue(null);
      onboardingModel.createUser.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      } as any);
      onboardingMapper.toStartUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      await service.startUserOnboarding(validDto);

      expect(logger.info).toHaveBeenCalledWith(
        '[ONBOARDING] Starting user onboarding',
        expect.any(Object),
      );
      expect(logger.info).toHaveBeenCalledWith(
        '[ONBOARDING] User onboarding started successfully',
        expect.any(Object),
      );
    });

    it('should extract username from email before @ symbol', async () => {
      const dto = { email: 'john.doe@company.com' };

      onboardingModel.findUserByEmail.mockResolvedValue(null);
      onboardingModel.createUser.mockResolvedValue({
        id: 'user-123',
        email: 'john.doe@company.com',
      } as any);
      onboardingMapper.toStartUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      await service.startUserOnboarding(dto);

      expect(onboardingModel.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'john.doe' }),
      );
    });
  });

  describe('updateUserOnboarding', () => {
    const userId = 'user-123';

    const mockUser = {
      id: userId,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      onboardingState: { completedSteps: ['1.1'], needsCorrection: [] },
    };

    beforeEach(() => {
      onboardingModel.findUserById.mockResolvedValue(mockUser as any);
    });

    it('should throw error when user is not found', async () => {
      onboardingModel.findUserById.mockResolvedValue(null);

      await expect(
        service.updateUserOnboarding(userId, { phone: '123456789' }),
      ).rejects.toThrow('users.errors.userNotFound');
    });

    it('should update phone and add step 1.4', async () => {
      const dto = { phone: '(11) 99999-9999' };
      const updatedUser = {
        ...mockUser,
        phone: '11999999999',
        onboardingState: {
          completedSteps: ['1.1', '1.4'],
          needsCorrection: [],
        },
      };

      onboardingModel.updateUserOnboarding.mockResolvedValue(updatedUser as any);
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue({
        success: true,
      } as any);

      await service.updateUserOnboarding(userId, dto);

      expect(onboardingModel.updateUserOnboarding).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ phone: '11999999999' }),
      );
    });

    it('should normalize phone by removing non-digit characters', async () => {
      const dto = { phone: '+55 (11) 99999-9999' };

      onboardingModel.updateUserOnboarding.mockResolvedValue(mockUser as any);
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      await service.updateUserOnboarding(userId, dto);

      expect(onboardingModel.updateUserOnboarding).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ phone: '+55 11999999999' }),
      );
    });

    it('should update password and add step 1.7', async () => {
      const dto = { password: '123456' };

      onboardingModel.updateUserOnboarding.mockResolvedValue(mockUser as any);
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      const hashSpy = jest
        .spyOn(PasswordHelper, 'hash')
        .mockResolvedValue('hashed-password');

      await service.updateUserOnboarding(userId, dto);

      expect(hashSpy).toHaveBeenCalledWith('123456');
      expect(onboardingModel.updateUserOnboarding).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          password: 'hashed-password',
          status: 'pending',
          passwordUpdatedAt: expect.any(Date),
        }),
      );

      hashSpy.mockRestore();
    });

    it('should process campaign code when provided with password', async () => {
      const dto = { password: '123456', campaignCode: 'PROMO2024' };
      const mockCampaign = {
        id: 'campaign-123',
        code: 'PROMO2024',
        validFrom: null,
        validTo: null,
      };

      onboardingModel.findCampaignCode.mockResolvedValue(mockCampaign as any);
      onboardingModel.findUserCampaignCode.mockResolvedValue(null);
      onboardingModel.createUserCampaignCode.mockResolvedValue({} as any);
      onboardingModel.updateUserOnboarding.mockResolvedValue(mockUser as any);
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      jest.spyOn(PasswordHelper, 'hash').mockResolvedValue('hashed');

      await service.updateUserOnboarding(userId, dto);

      expect(onboardingModel.findCampaignCode).toHaveBeenCalledWith('PROMO2024');
      expect(onboardingModel.createUserCampaignCode).toHaveBeenCalledWith(
        userId,
        'campaign-123',
        'PROMO2024',
      );
    });

    it('should not create duplicate user campaign code', async () => {
      const dto = { password: '123456', campaignCode: 'PROMO2024' };
      const mockCampaign = {
        id: 'campaign-123',
        code: 'PROMO2024',
        validFrom: null,
        validTo: null,
      };

      onboardingModel.findCampaignCode.mockResolvedValue(mockCampaign as any);
      onboardingModel.findUserCampaignCode.mockResolvedValue({
        id: 'existing',
      } as any);
      onboardingModel.updateUserOnboarding.mockResolvedValue(mockUser as any);
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      jest.spyOn(PasswordHelper, 'hash').mockResolvedValue('hashed');

      await service.updateUserOnboarding(userId, dto);

      expect(onboardingModel.createUserCampaignCode).not.toHaveBeenCalled();
    });

    it('should not process expired campaign code', async () => {
      const dto = { password: '123456', campaignCode: 'EXPIRED' };
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const mockCampaign = {
        id: 'campaign-123',
        code: 'EXPIRED',
        validFrom: null,
        validTo: pastDate,
      };

      onboardingModel.findCampaignCode.mockResolvedValue(mockCampaign as any);
      onboardingModel.updateUserOnboarding.mockResolvedValue(mockUser as any);
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      jest.spyOn(PasswordHelper, 'hash').mockResolvedValue('hashed');

      await service.updateUserOnboarding(userId, dto);

      expect(onboardingModel.createUserCampaignCode).not.toHaveBeenCalled();
    });

    it('should not process campaign code that is not yet valid', async () => {
      const dto = { password: '123456', campaignCode: 'FUTURE' };
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const mockCampaign = {
        id: 'campaign-123',
        code: 'FUTURE',
        validFrom: futureDate,
        validTo: null,
      };

      onboardingModel.findCampaignCode.mockResolvedValue(mockCampaign as any);
      onboardingModel.updateUserOnboarding.mockResolvedValue(mockUser as any);
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      jest.spyOn(PasswordHelper, 'hash').mockResolvedValue('hashed');

      await service.updateUserOnboarding(userId, dto);

      expect(onboardingModel.createUserCampaignCode).not.toHaveBeenCalled();
    });

    it('should update firstName and lastName and add step 1.8', async () => {
      const dto = { firstName: 'Jane', lastName: 'Smith' };

      onboardingModel.updateUserOnboarding.mockResolvedValue(mockUser as any);
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      await service.updateUserOnboarding(userId, dto);

      expect(onboardingModel.updateUserOnboarding).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Smith',
          name: 'Jane Smith',
          username: 'Jane',
        }),
      );
    });

    it('should update only firstName when lastName is not provided', async () => {
      const dto = { firstName: 'Jane' };

      onboardingModel.updateUserOnboarding.mockResolvedValue(mockUser as any);
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      await service.updateUserOnboarding(userId, dto);

      expect(onboardingModel.updateUserOnboarding).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Doe',
          name: 'Jane',
          username: 'Jane',
        }),
      );
    });

    it('should update only lastName when firstName is not provided', async () => {
      const dto = { lastName: 'Smith' };

      onboardingModel.updateUserOnboarding.mockResolvedValue(mockUser as any);
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      await service.updateUserOnboarding(userId, dto);

      expect(onboardingModel.updateUserOnboarding).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Smith',
          name: 'Smith',
        }),
      );
    });

    it('should update country, birthdate, gender, maritalStatus and add step 1.9', async () => {
      const dto = {
        country: 'br',
        birthdate: '1990-01-15',
        gender: 'male',
        maritalStatus: 'single',
      };

      onboardingModel.updateUserOnboarding.mockResolvedValue(mockUser as any);
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      await service.updateUserOnboarding(userId, dto);

      expect(onboardingModel.updateUserOnboarding).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          country: 'br',
          birthdate: new Date('1990-01-15'),
          gender: 'male',
          maritalStatus: 'single',
        }),
      );
    });

    it('should update pep and pepSince and add step 1.10', async () => {
      const dto = { pep: 'yes', pepSince: '2020-01-01' };

      onboardingModel.updateUserOnboarding.mockResolvedValue(mockUser as any);
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      await service.updateUserOnboarding(userId, dto);

      expect(onboardingModel.updateUserOnboarding).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          pep: 'yes',
          pepSince: new Date('2020-01-01'),
        }),
      );
    });

    it('should process liveness image when Valida is disabled', async () => {
      const dto = { livenessImage: 'base64-image-data' };
      const userWithEmail = { ...mockUser, email: 'test@example.com' };

      onboardingModel.findUserById.mockResolvedValue(userWithEmail as any);
      onboardingModel.updateUserOnboarding.mockResolvedValue(
        userWithEmail as any,
      );
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );
      appConfigService.isValidaEnabled.mockReturnValue(false);
      notificationService.sendEmail.mockResolvedValue(undefined);

      await service.updateUserOnboarding(userId, dto);

      expect(appConfigService.isValidaEnabled).toHaveBeenCalled();
      expect(notificationService.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Selfie recebida',
        text: 'We received your selfie for proof-of-life verification.',
      });
    });

    it('should not send email when Valida is enabled', async () => {
      const dto = { livenessImage: 'base64-image-data' };

      onboardingModel.updateUserOnboarding.mockResolvedValue(mockUser as any);
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );
      appConfigService.isValidaEnabled.mockReturnValue(true);

      await service.updateUserOnboarding(userId, dto);

      expect(notificationService.sendEmail).not.toHaveBeenCalled();
    });

    it('should add step 1.13 when all required steps are completed', async () => {
      const userWithAllSteps = {
        ...mockUser,
        onboardingState: {
          completedSteps: [
            '1.1',
            '1.2',
            '1.3',
            '1.4',
            '1.5',
            '1.6',
            '1.7',
            '1.8',
            '1.9',
            '1.10',
            '1.11',
            '1.12',
          ],
          needsCorrection: [],
        },
      };

      onboardingModel.findUserById.mockResolvedValue(userWithAllSteps as any);
      onboardingModel.updateUserOnboarding.mockResolvedValue(
        userWithAllSteps as any,
      );
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      await service.updateUserOnboarding(userId, { firstName: 'Test' });

      expect(logger.info).toHaveBeenCalledWith(
        '[ONBOARDING] All user onboarding steps completed',
        expect.any(Object),
      );
    });

    it('should not duplicate completed steps', async () => {
      const userWithStep = {
        ...mockUser,
        onboardingState: {
          completedSteps: ['1.1', '1.4'],
          needsCorrection: [],
        },
      };

      onboardingModel.findUserById.mockResolvedValue(userWithStep as any);
      onboardingModel.updateUserOnboarding.mockResolvedValue(
        userWithStep as any,
      );
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      await service.updateUserOnboarding(userId, { phone: '123456789' });

      const callArgs = onboardingModel.updateUserOnboarding.mock.calls[0][1];
      const completedSteps = callArgs.onboardingState.completedSteps;
      const step14Count = completedSteps.filter(
        (s: string) => s === '1.4',
      ).length;
      expect(step14Count).toBe(1);
    });

    it('should handle user with null onboardingState', async () => {
      const userWithoutState = {
        ...mockUser,
        onboardingState: null,
      };

      onboardingModel.findUserById.mockResolvedValue(userWithoutState as any);
      onboardingModel.updateUserOnboarding.mockResolvedValue(
        userWithoutState as any,
      );
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      await service.updateUserOnboarding(userId, { phone: '123456789' });

      expect(onboardingModel.updateUserOnboarding).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          onboardingState: {
            completedSteps: ['1.4'],
            needsCorrection: [],
          },
        }),
      );
    });

    it('should log update operation', async () => {
      onboardingModel.updateUserOnboarding.mockResolvedValue(mockUser as any);
      onboardingMapper.toUpdateUserOnboardingResponseDto.mockReturnValue(
        {} as any,
      );

      await service.updateUserOnboarding(userId, { phone: '123456789' });

      expect(logger.info).toHaveBeenCalledWith(
        '[ONBOARDING] Updating user onboarding data',
        expect.objectContaining({ userId, fields: ['phone'] }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        '[ONBOARDING] User onboarding data updated successfully',
        expect.any(Object),
      );
    });
  });
});
