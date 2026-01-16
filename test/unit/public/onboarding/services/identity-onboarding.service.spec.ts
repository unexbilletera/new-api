import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { IdentityOnboardingService } from '../../../../../src/public/onboarding/services/identity-onboarding.service';
import { OnboardingModel } from '../../../../../src/public/onboarding/models/onboarding.model';
import { OnboardingMapper } from '../../../../../src/public/onboarding/mappers/onboarding.mapper';
import { LoggerService } from '../../../../../src/shared/logger/logger.service';
import { NotificationService } from '../../../../../src/shared/notifications/notifications.service';
import { RenaperService } from '../../../../../src/shared/renaper/renaper.service';
import { Pdf417ParserService } from '../../../../../src/shared/renaper/pdf417-parser.service';
import { S3Service } from '../../../../../src/shared/storage/s3.service';
import { UpdateIdentityOnboardingDto } from '../../../../../src/public/onboarding/dto/onboarding.dto';

describe('IdentityOnboardingService - updateIdentityOnboarding', () => {
  let service: IdentityOnboardingService;
  let mockOnboardingModel: jest.Mocked<OnboardingModel>;
  let mockOnboardingMapper: jest.Mocked<OnboardingMapper>;

  const mockIdentity = {
    id: 'identity-123',
    userId: 'user-123',
    country: 'br',
    status: 'pending',
    users_usersIdentities_userIdTousers: {
      onboardingState: {
        completedSteps: ['3.1'],
        needsCorrection: [],
      },
    },
  };

  beforeEach(async () => {
    mockOnboardingModel = {
      findIdentityById: jest.fn(),
      updateIdentity: jest.fn(),
      updateUserOnboardingComplete: jest.fn(),
    } as any;

    mockOnboardingMapper = {
      toUpdateIdentityOnboardingResponseDto: jest
        .fn()
        .mockReturnValue({ success: true }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityOnboardingService,
        {
          provide: OnboardingModel,
          useValue: mockOnboardingModel,
        },
        {
          provide: OnboardingMapper,
          useValue: mockOnboardingMapper,
        },
        {
          provide: LoggerService,
          useValue: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
        {
          provide: NotificationService,
          useValue: { sendEmail: jest.fn() },
        },
        {
          provide: RenaperService,
          useValue: {},
        },
        {
          provide: Pdf417ParserService,
          useValue: {},
        },
        {
          provide: S3Service,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<IdentityOnboardingService>(
      IdentityOnboardingService,
    );
  });

  describe('CPF Handling', () => {
    it('should save CPF to taxDocumentNumber with type CPF', async () => {
      mockOnboardingModel.findIdentityById.mockResolvedValue(mockIdentity);

      const dto: UpdateIdentityOnboardingDto = {
        cpf: '12345678900',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      expect(mockOnboardingModel.updateIdentity).toHaveBeenCalledWith(
        'identity-123',
        expect.objectContaining({
          taxDocumentNumber: '12345678900',
          taxDocumentType: 'CPF',
        }),
      );
    });

    it('should handle CPF with formatting', async () => {
      mockOnboardingModel.findIdentityById.mockResolvedValue(mockIdentity);

      const dto: UpdateIdentityOnboardingDto = {
        cpf: '123.456.789-00',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      expect(mockOnboardingModel.updateIdentity).toHaveBeenCalledWith(
        'identity-123',
        expect.objectContaining({
          taxDocumentNumber: '123.456.789-00',
          taxDocumentType: 'CPF',
        }),
      );
    });
  });

  describe('RG Handling', () => {
    it('should save RG to identityDocumentNumber with type RG', async () => {
      mockOnboardingModel.findIdentityById.mockResolvedValue(mockIdentity);

      const dto: UpdateIdentityOnboardingDto = {
        rg: 'MG1234567',
        rgIssuer: 'SSP-SP',
        rgExpiration: '2030-12-31',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      expect(mockOnboardingModel.updateIdentity).toHaveBeenCalledWith(
        'identity-123',
        expect.objectContaining({
          identityDocumentNumber: 'MG1234567',
          identityDocumentType: 'RG',
          identityDocumentIssuer: 'SSP-SP',
          identityDocumentIssueDate: new Date('2030-12-31'),
        }),
      );
    });

    it('should save RG without issuer and expiration', async () => {
      mockOnboardingModel.findIdentityById.mockResolvedValue(mockIdentity);

      const dto: UpdateIdentityOnboardingDto = {
        rg: 'MG1234567',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      expect(mockOnboardingModel.updateIdentity).toHaveBeenCalledWith(
        'identity-123',
        expect.objectContaining({
          identityDocumentNumber: 'MG1234567',
          identityDocumentType: 'RG',
        }),
      );
    });

    it('should save RG issuer when provided', async () => {
      mockOnboardingModel.findIdentityById.mockResolvedValue(mockIdentity);

      const dto: UpdateIdentityOnboardingDto = {
        rg: 'MG1234567',
        rgIssuer: 'DETRAN-MG',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      expect(mockOnboardingModel.updateIdentity).toHaveBeenCalledWith(
        'identity-123',
        expect.objectContaining({
          identityDocumentIssuer: 'DETRAN-MG',
        }),
      );
    });

    it('should save RG expiration when provided', async () => {
      mockOnboardingModel.findIdentityById.mockResolvedValue(mockIdentity);

      const dto: UpdateIdentityOnboardingDto = {
        rg: 'SP123456789',
        rgExpiration: '2028-06-30',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      expect(mockOnboardingModel.updateIdentity).toHaveBeenCalledWith(
        'identity-123',
        expect.objectContaining({
          identityDocumentIssueDate: new Date('2028-06-30'),
        }),
      );
    });
  });

  describe('CPF and RG Together', () => {
    it('should save both CPF and RG in separate fields', async () => {
      mockOnboardingModel.findIdentityById.mockResolvedValue(mockIdentity);

      const dto: UpdateIdentityOnboardingDto = {
        cpf: '12345678900',
        rg: 'MG1234567',
        rgIssuer: 'SSP-SP',
        rgExpiration: '2030-12-31',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      expect(mockOnboardingModel.updateIdentity).toHaveBeenCalledWith(
        'identity-123',
        expect.objectContaining({
          taxDocumentNumber: '12345678900',
          taxDocumentType: 'CPF',
          identityDocumentNumber: 'MG1234567',
          identityDocumentType: 'RG',
          identityDocumentIssuer: 'SSP-SP',
          identityDocumentIssueDate: new Date('2030-12-31'),
        }),
      );
    });

    it('should not overwrite fields when only CPF is provided', async () => {
      mockOnboardingModel.findIdentityById.mockResolvedValue(mockIdentity);

      const dto: UpdateIdentityOnboardingDto = {
        cpf: '12345678900',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      const updateCall = mockOnboardingModel.updateIdentity.mock.calls[0][1];
      expect(updateCall.taxDocumentNumber).toBe('12345678900');
      expect(updateCall.taxDocumentType).toBe('CPF');
      expect(updateCall.identityDocumentNumber).toBeUndefined();
    });
  });

  describe('Legacy Compatibility (documentNumber)', () => {
    it('should infer CPF from documentNumber when country is BR and 11 digits', async () => {
      mockOnboardingModel.findIdentityById.mockResolvedValue(mockIdentity);

      const dto: UpdateIdentityOnboardingDto = {
        documentNumber: '12345678900',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      expect(mockOnboardingModel.updateIdentity).toHaveBeenCalledWith(
        'identity-123',
        expect.objectContaining({
          taxDocumentNumber: '12345678900',
          taxDocumentType: 'CPF',
        }),
      );
    });

    it('should infer RG from documentNumber when country is BR and not 11 digits', async () => {
      mockOnboardingModel.findIdentityById.mockResolvedValue(mockIdentity);

      const dto: UpdateIdentityOnboardingDto = {
        documentNumber: 'MG1234567',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      expect(mockOnboardingModel.updateIdentity).toHaveBeenCalledWith(
        'identity-123',
        expect.objectContaining({
          identityDocumentNumber: 'MG1234567',
          identityDocumentType: 'RG',
        }),
      );
    });

    it('should infer DNI for Argentina from documentNumber', async () => {
      const argentineIdentity = {
        ...mockIdentity,
        country: 'ar',
      };
      mockOnboardingModel.findIdentityById.mockResolvedValue(argentineIdentity);

      const dto: UpdateIdentityOnboardingDto = {
        documentNumber: '12345678',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      expect(mockOnboardingModel.updateIdentity).toHaveBeenCalledWith(
        'identity-123',
        expect.objectContaining({
          identityDocumentNumber: '12345678',
          identityDocumentType: 'DNI',
        }),
      );
    });

    it('should not use legacy field when new fields are provided', async () => {
      mockOnboardingModel.findIdentityById.mockResolvedValue(mockIdentity);

      const dto: UpdateIdentityOnboardingDto = {
        cpf: '12345678900',
        documentNumber: 'should-be-ignored',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      expect(mockOnboardingModel.updateIdentity).toHaveBeenCalledWith(
        'identity-123',
        expect.objectContaining({
          taxDocumentNumber: '12345678900',
        }),
      );
    });

    it('should handle legacy documentIssuer with rgIssuer priority', async () => {
      mockOnboardingModel.findIdentityById.mockResolvedValue(mockIdentity);

      const dto: UpdateIdentityOnboardingDto = {
        rg: 'MG1234567',
        rgIssuer: 'SSP-SP',
        documentIssuer: 'should-be-ignored',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      expect(mockOnboardingModel.updateIdentity).toHaveBeenCalledWith(
        'identity-123',
        expect.objectContaining({
          identityDocumentIssuer: 'SSP-SP',
        }),
      );
    });
  });

  describe('Step Completion', () => {
    it('should mark step 3.2 as complete for Brazil', async () => {
      mockOnboardingModel.findIdentityById.mockResolvedValue(mockIdentity);

      const dto: UpdateIdentityOnboardingDto = {
        cpf: '12345678900',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      expect(mockOnboardingModel.updateUserOnboardingComplete).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          onboardingState: expect.objectContaining({
            completedSteps: expect.arrayContaining(['3.2']),
          }),
        }),
      );
    });

    it('should mark step 2.2 as complete for Argentina', async () => {
      const argentineIdentity = {
        ...mockIdentity,
        country: 'ar',
      };
      mockOnboardingModel.findIdentityById.mockResolvedValue(argentineIdentity);

      const dto: UpdateIdentityOnboardingDto = {
        documentNumber: '12345678',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      expect(mockOnboardingModel.updateUserOnboardingComplete).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          onboardingState: expect.objectContaining({
            completedSteps: expect.arrayContaining(['2.2']),
          }),
        }),
      );
    });

    it('should not duplicate step when it already exists', async () => {
      const identityWithStep = {
        ...mockIdentity,
        users_usersIdentities_userIdTousers: {
          onboardingState: {
            completedSteps: ['3.1', '3.2'],
            needsCorrection: [],
          },
        },
      };
      mockOnboardingModel.findIdentityById.mockResolvedValue(
        identityWithStep,
      );

      const dto: UpdateIdentityOnboardingDto = {
        cpf: '12345678900',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      const updateCall =
        mockOnboardingModel.updateUserOnboardingComplete.mock.calls[0][1];
      const step32Count = updateCall.onboardingState.completedSteps.filter(
        (s) => s === '3.2',
      ).length;
      expect(step32Count).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should throw NotFoundException when identity not found', async () => {
      mockOnboardingModel.findIdentityById.mockResolvedValue(null);

      const dto: UpdateIdentityOnboardingDto = {
        cpf: '12345678900',
      };

      await expect(
        service.updateIdentityOnboarding('identity-123', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle empty onboardingState gracefully', async () => {
      const identityWithoutState = {
        ...mockIdentity,
        users_usersIdentities_userIdTousers: {
          onboardingState: null,
        },
      };
      mockOnboardingModel.findIdentityById.mockResolvedValue(
        identityWithoutState,
      );

      const dto: UpdateIdentityOnboardingDto = {
        cpf: '12345678900',
      };

      await service.updateIdentityOnboarding('identity-123', dto);

      expect(mockOnboardingModel.updateUserOnboardingComplete).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          onboardingState: expect.objectContaining({
            completedSteps: expect.arrayContaining(['3.2']),
          }),
        }),
      );
    });
  });
});
