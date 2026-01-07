import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SignupService } from '../../../../src/public/auth/services/signup.service';
import { AuthUserModel } from '../../../../src/public/auth/models/user.model';
import { ValidationCodeModel } from '../../../../src/public/auth/models/validation-code.model';
import { JwtService } from '../../../../src/shared/jwt/jwt.service';
import { AuthMapper } from '../../../../src/public/auth/mappers/auth.mapper';
import { PrismaService } from '../../../../src/shared/prisma/prisma.service';

describe('SignupService', () => {
  let service: SignupService;
  let userModel: jest.Mocked<AuthUserModel>;
  let validationCodeModel: jest.Mocked<ValidationCodeModel>;
  let jwtService: jest.Mocked<JwtService>;
  let prisma: jest.Mocked<PrismaService>;
  let authMapper: jest.Mocked<AuthMapper>;

  const mockSignupDto = {
    email: 'newuser@example.com',
    phone: '+5511999999999',
    password: '123456',
    firstName: 'John',
    lastName: 'Doe',
    language: 'pt',
  };

  const mockNewUser = {
    id: 'user-uuid-123',
    email: 'newuser@example.com',
    phone: '+5511999999999',
    firstName: 'John',
    lastName: 'Doe',
    language: 'pt',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    userModel = {
      exists: jest.fn(),
      create: jest.fn(),
      findByEmail: jest.fn(),
    } as unknown as jest.Mocked<AuthUserModel>;

    validationCodeModel = {
      getValidatedEmailCode: jest.fn(),
      getValidatedPhoneCode: jest.fn(),
      deleteEmailValidationCodes: jest.fn(),
      deletePhoneValidationCodes: jest.fn(),
    } as unknown as jest.Mocked<ValidationCodeModel>;

    jwtService = {
      generateToken: jest.fn(),
      verifyToken: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    prisma = {
      devices: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as unknown as jest.Mocked<PrismaService>;

    authMapper = {
      toSignupResponseDto: jest.fn(),
      toSignupDeviceRequiredResponseDto: jest.fn(),
    } as unknown as jest.Mocked<AuthMapper>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignupService,
        { provide: AuthUserModel, useValue: userModel },
        { provide: ValidationCodeModel, useValue: validationCodeModel },
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prisma },
        { provide: AuthMapper, useValue: authMapper },
      ],
    }).compile();

    service = module.get<SignupService>(SignupService);

    validationCodeModel.deleteEmailValidationCodes.mockResolvedValue(undefined);
    validationCodeModel.deletePhoneValidationCodes.mockResolvedValue(undefined);

    authMapper.toSignupResponseDto.mockReturnValue({
      user: mockNewUser,
      accessToken: 'jwt_token_default',
      expiresIn: 3600,
    });
    authMapper.toSignupDeviceRequiredResponseDto.mockReturnValue({
      user: mockNewUser,
      accessToken: 'jwt_token_default',
      deviceRequired: true,
      registrationType: 'soft',
    } as any);
  });

  describe('signup', () => {
    it('should create user successfully with valid data', async () => {
      userModel.exists.mockResolvedValue(false);
      validationCodeModel.getValidatedEmailCode.mockResolvedValue(true);
      validationCodeModel.getValidatedPhoneCode.mockResolvedValue(true);
      userModel.create.mockResolvedValue(mockNewUser);
      jwtService.generateToken.mockResolvedValue('jwt_token_123');
      authMapper.toSignupResponseDto.mockReturnValue({
        user: mockNewUser,
        accessToken: 'jwt_token_123',
        expiresIn: 3600,
      });

      const result = await service.signup(mockSignupDto);

      expect(userModel.exists).toHaveBeenCalledWith(
        'newuser@example.com',
        '5511999999999'
      );
      expect(validationCodeModel.getValidatedEmailCode).toHaveBeenCalledWith('newuser@example.com');
      expect(validationCodeModel.getValidatedPhoneCode).toHaveBeenCalledWith('5511999999999');
      expect(userModel.create).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
    });

    it('should normalize email to lowercase', async () => {
      const dtoWithUppercaseEmail = { ...mockSignupDto, email: 'NewUser@EXAMPLE.COM' };
      userModel.exists.mockResolvedValue(false);
      validationCodeModel.getValidatedEmailCode.mockResolvedValue(true);
      validationCodeModel.getValidatedPhoneCode.mockResolvedValue(true);
      userModel.create.mockResolvedValue(mockNewUser);

      await service.signup(dtoWithUppercaseEmail);

      expect(userModel.exists).toHaveBeenCalledWith(
        'newuser@example.com',
        expect.any(String)
      );
    });

    it('should normalize phone by removing non-digits', async () => {
      const dtoWithFormattedPhone = { ...mockSignupDto, phone: '+55 (11) 99999-9999' };
      userModel.exists.mockResolvedValue(false);
      validationCodeModel.getValidatedEmailCode.mockResolvedValue(true);
      validationCodeModel.getValidatedPhoneCode.mockResolvedValue(true);
      userModel.create.mockResolvedValue(mockNewUser);

      await service.signup(dtoWithFormattedPhone);

      expect(userModel.exists).toHaveBeenCalledWith(
        expect.any(String),
        '5511999999999'
      );
    });

    it('should throw BadRequestException if user already exists', async () => {
      userModel.exists.mockResolvedValue(true);

      await expect(service.signup(mockSignupDto)).rejects.toThrow(BadRequestException);
      expect(userModel.exists).toHaveBeenCalled();
      expect(validationCodeModel.getValidatedEmailCode).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if email not validated', async () => {
      userModel.exists.mockResolvedValue(false);
      validationCodeModel.getValidatedEmailCode.mockResolvedValue(false);

      await expect(service.signup(mockSignupDto)).rejects.toThrow(BadRequestException);
      expect(validationCodeModel.getValidatedPhoneCode).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if phone not validated', async () => {
      userModel.exists.mockResolvedValue(false);
      validationCodeModel.getValidatedEmailCode.mockResolvedValue(true);
      validationCodeModel.getValidatedPhoneCode.mockResolvedValue(false);

      await expect(service.signup(mockSignupDto)).rejects.toThrow(BadRequestException);
      expect(userModel.create).not.toHaveBeenCalled();
    });

    it('should create user with correct initial state', async () => {
      userModel.exists.mockResolvedValue(false);
      validationCodeModel.getValidatedEmailCode.mockResolvedValue(true);
      validationCodeModel.getValidatedPhoneCode.mockResolvedValue(true);
      userModel.create.mockResolvedValue(mockNewUser);
      jwtService.generateToken.mockResolvedValue('jwt_token_123');
      authMapper.toSignupResponseDto.mockReturnValue({
        user: mockNewUser,
        accessToken: 'jwt_token_123',
        expiresIn: 3600,
      });

      const result = await service.signup(mockSignupDto);

      expect(result.user.firstName).toEqual('John');
      expect(result.user.email).toEqual('newuser@example.com');
    });

    it('should generate JWT token on successful signup', async () => {
      userModel.exists.mockResolvedValue(false);
      validationCodeModel.getValidatedEmailCode.mockResolvedValue(true);
      validationCodeModel.getValidatedPhoneCode.mockResolvedValue(true);
      userModel.create.mockResolvedValue(mockNewUser);
      jwtService.generateToken.mockResolvedValue('jwt_token_abc');
      authMapper.toSignupResponseDto.mockReturnValue({
        user: mockNewUser,
        accessToken: 'jwt_token_abc',
        expiresIn: 3600,
      });

      const result = await service.signup(mockSignupDto);

      expect(jwtService.generateToken).toHaveBeenCalled();
      expect(result.accessToken).toBeDefined();
    });

    it('should handle database errors', async () => {
      userModel.exists.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.signup(mockSignupDto)).rejects.toThrow();
    });

    it('should clean up validation codes after signup', async () => {
      userModel.exists.mockResolvedValue(false);
      validationCodeModel.getValidatedEmailCode.mockResolvedValue(true);
      validationCodeModel.getValidatedPhoneCode.mockResolvedValue(true);
      userModel.create.mockResolvedValue(mockNewUser);
      jwtService.generateToken.mockResolvedValue('jwt_token_123');
      authMapper.toSignupResponseDto.mockReturnValue({
        user: mockNewUser,
        accessToken: 'jwt_token_123',
        expiresIn: 3600,
      });

      await service.signup(mockSignupDto);

      expect(validationCodeModel.deleteEmailValidationCodes).toHaveBeenCalledWith('newuser@example.com');
      expect(validationCodeModel.deletePhoneValidationCodes).toHaveBeenCalledWith('5511999999999');
    });
  });

  describe('email normalization', () => {
    it('should handle emails with spaces', async () => {
      const dtoWithSpaces = { ...mockSignupDto, email: '  newuser@example.com  ' };
      userModel.exists.mockResolvedValue(false);
      validationCodeModel.getValidatedEmailCode.mockResolvedValue(true);
      validationCodeModel.getValidatedPhoneCode.mockResolvedValue(true);
      userModel.create.mockResolvedValue(mockNewUser);
      jwtService.generateToken.mockResolvedValue('jwt_token_123');
      authMapper.toSignupResponseDto.mockReturnValue({
        user: mockNewUser,
        accessToken: 'jwt_token_123',
        expiresIn: 3600,
      });

      await service.signup(dtoWithSpaces);

      expect(userModel.exists).toHaveBeenCalledWith(
        'newuser@example.com',
        expect.any(String)
      );
    });

    it('should handle mixed case emails', async () => {
      const dtoWithMixedCase = { ...mockSignupDto, email: 'NeWuSeR@ExAmPlE.cOm' };
      userModel.exists.mockResolvedValue(false);
      validationCodeModel.getValidatedEmailCode.mockResolvedValue(true);
      validationCodeModel.getValidatedPhoneCode.mockResolvedValue(true);
      userModel.create.mockResolvedValue(mockNewUser);
      jwtService.generateToken.mockResolvedValue('jwt_token_123');
      authMapper.toSignupResponseDto.mockReturnValue({
        user: mockNewUser,
        accessToken: 'newuser@example.com',
        expiresIn: 3600,
      });

      await service.signup(dtoWithMixedCase);

      expect(userModel.exists).toHaveBeenCalledWith(
        'newuser@example.com',
        expect.any(String)
      );
    });
  });

  describe('phone normalization', () => {
    it('should handle phone with special characters', async () => {
      const dtoWithSpecialChars = { ...mockSignupDto, phone: '+55 (11) 9 9999-9999' };
      userModel.exists.mockResolvedValue(false);
      validationCodeModel.getValidatedEmailCode.mockResolvedValue(true);
      validationCodeModel.getValidatedPhoneCode.mockResolvedValue(true);
      userModel.create.mockResolvedValue(mockNewUser);
      jwtService.generateToken.mockResolvedValue('jwt_token_123');
      authMapper.toSignupResponseDto.mockReturnValue({
        user: mockNewUser,
        accessToken: 'jwt_token_123',
        expiresIn: 3600,
      });

      await service.signup(dtoWithSpecialChars);

      expect(userModel.exists).toHaveBeenCalledWith(
        expect.any(String),
        '5511999999999'
      );
    });

    it('should handle phone without country code', async () => {
      const dtoWithoutCountryCode = { ...mockSignupDto, phone: '11999999999' };
      userModel.exists.mockResolvedValue(false);
      validationCodeModel.getValidatedEmailCode.mockResolvedValue(true);
      validationCodeModel.getValidatedPhoneCode.mockResolvedValue(true);
      userModel.create.mockResolvedValue(mockNewUser);
      jwtService.generateToken.mockResolvedValue('jwt_token_123');
      authMapper.toSignupResponseDto.mockReturnValue({
        user: mockNewUser,
        accessToken: 'jwt_token_123',
        expiresIn: 3600,
      });

      await service.signup(dtoWithoutCountryCode);

      expect(userModel.exists).toHaveBeenCalledWith(
        expect.any(String),
        '11999999999'
      );
    });
  });
});
