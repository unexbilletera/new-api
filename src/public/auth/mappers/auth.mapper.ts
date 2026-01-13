import { Injectable } from '@nestjs/common';
import {
  SignupResponseDto,
  SignupDeviceRequiredResponseDto,
  SigninResponseDto,
  SigninDeviceRequiredResponseDto,
  EmailValidationResponseDto,
  EmailCodeVerificationResponseDto,
  PhoneValidationResponseDto,
  PhoneCodeVerificationResponseDto,
  ForgotPasswordResponseDto,
  VerifyPasswordResponseDto,
  UnlockAccountResponseDto,
  TokenResponseDto,
} from '../dto/response';

@Injectable()
export class AuthMapper {
  toSignupResponseDto(
    user: any,
    token: string,
    expiresIn: number = 3600,
  ): SignupResponseDto {
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
      accessToken: token,
      expiresIn,
    };
  }

  toSignupDeviceRequiredResponseDto(
    user: any,
    token: string,
    deviceType: string,
  ): SignupDeviceRequiredResponseDto {
    return {
      deviceRequired: true,
      deviceType,
      message: 'It is necessary to register a device to continue',
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
    };
  }

  toSigninResponseDto(
    user: any,
    token: string,
    expiresIn: number = 3600,
  ): SigninResponseDto {
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
      accessToken: token,
      expiresIn,
    };
  }

  toSigninDeviceRequiredResponseDto(
    user: any,
    token: string,
    deviceType: string,
  ): SigninDeviceRequiredResponseDto {
    return {
      deviceRequired: true,
      deviceType,
      message: 'It is necessary to register a device to continue',
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
    };
  }

  toEmailValidationResponseDto(message: string): EmailValidationResponseDto {
    return {
      message,
    };
  }

  toEmailCodeVerificationResponseDto(
    message: string,
    email: string,
  ): EmailCodeVerificationResponseDto {
    return {
      message,
      email,
      nextStep: 'password',
    };
  }

  toPhoneValidationResponseDto(message: string): PhoneValidationResponseDto {
    return {
      message,
    };
  }

  toPhoneCodeVerificationResponseDto(
    message: string,
    phone: string,
  ): PhoneCodeVerificationResponseDto {
    return {
      message,
      phone,
      nextStep: 'password',
    };
  }

  toForgotPasswordResponseDto(message: string): ForgotPasswordResponseDto {
    return {
      message,
    };
  }

  toVerifyPasswordResponseDto(message: string): VerifyPasswordResponseDto {
    return { message };
  }

  toUnlockAccountResponseDto(
    user: any,
    token: string,
    expiresIn: number = 3600,
  ): UnlockAccountResponseDto {
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        status: user.status,
        access: user.access,
      },
      accessToken: token,
      expiresIn,
      message: 'Account unlocked successfully',
    };
  }

  toTokenResponseDto(
    token: string,
    expiresIn: number = 3600,
  ): TokenResponseDto {
    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn,
    };
  }
}
