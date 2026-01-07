import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthUserModel } from '../models/user.model';
import { ValidationCodeModel } from '../models/validation-code.model';
import { PasswordHelper } from '../../../shared/helpers/password.helper';
import { JwtService, JwtPayload } from '../../../shared/jwt/jwt.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { AuthMapper } from '../mappers/auth.mapper';
import { SignupDto } from '../dto/signup.dto';

@Injectable()
export class SignupService {
  constructor(
    private userModel: AuthUserModel,
    private validationCodeModel: ValidationCodeModel,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private authMapper: AuthMapper,
  ) {}

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  async signup(dto: SignupDto) {
    const email = this.normalizeEmail(dto.email);
    const phone = this.normalizePhone(dto.phone);

    const existingUser = await this.userModel.exists(email, phone);
    if (existingUser) {
      throw new BadRequestException('users.errors.userAlreadyExists');
    }

    const emailValidated = await this.validationCodeModel.getValidatedEmailCode(email);
    if (!emailValidated) {
      throw new BadRequestException('users.errors.emailValidationRequired');
    }

    const phoneValidated = await this.validationCodeModel.getValidatedPhoneCode(phone);
    if (!phoneValidated) {
      throw new BadRequestException('users.errors.phoneValidationRequired');
    }

    const hashedPassword = await PasswordHelper.hash(dto.password);
    const onboardingState = {
      completedSteps: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7'],
      needsCorrection: [],
    };

    const user = await this.userModel.create({
      id: randomUUID(),
      status: 'pending',
      access: 'user',
      email,
      username: email.split('@')[0],
      phone,
      firstName: dto.firstName,
      lastName: dto.lastName,
      name:
        dto.firstName && dto.lastName
          ? `${dto.firstName} ${dto.lastName}`
          : dto.firstName || dto.lastName || email,
      language: dto.language || 'es',
      password: hashedPassword,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      passwordUpdatedAt: new Date(),
      onboardingState,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.validationCodeModel.deleteEmailValidationCodes(email);
    await this.validationCodeModel.deletePhoneValidationCodes(phone);

    let deviceRequired = false;
    if (dto.deviceIdentifier) {
      const existingDevice = await this.prisma.devices.findFirst({
        where: { userId: user.id, deviceIdentifier: dto.deviceIdentifier, status: 'active' },
      });
      deviceRequired = !existingDevice;
    } else {
      const anyActiveDevice = await this.prisma.devices.findFirst({
        where: { userId: user.id, status: 'active' },
      });
      deviceRequired = !anyActiveDevice;
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email || email,
      roleId: user.id,
    };
    const token = await this.jwtService.generateToken(payload);

    if (deviceRequired) {
      return this.authMapper.toSignupDeviceRequiredResponseDto(user, token, 'soft');
    }

    return this.authMapper.toSignupResponseDto(user, token);
  }
}
