import { Injectable } from '@nestjs/common';
import {
  TermCheckResponseDto,
  TermAcceptanceResponseDto,
  AcceptTermResponseDto,
  ListAcceptancesResponseDto,
  CheckAllRequiredResponseDto,
} from '../dto/response';

@Injectable()
export class TermsMapper {
  toTermCheckResponseDto(
    accepted: boolean,
    serviceType: string,
    acceptedAt?: Date,
    version?: string,
  ): TermCheckResponseDto {
    return {
      accepted,
      serviceType,
      acceptedAt,
      version,
    };
  }

  toTermAcceptanceResponseDto(acceptance: any): TermAcceptanceResponseDto {
    return {
      id: acceptance.id,
      userId: acceptance.userId,
      serviceType: acceptance.serviceType,
      version: acceptance.version || undefined,
      acceptedAt: acceptance.acceptedAt,
      ipAddress: acceptance.ipAddress || undefined,
    };
  }

  toAcceptTermResponseDto(
    success: boolean,
    message: string,
    data?: TermAcceptanceResponseDto,
  ): AcceptTermResponseDto {
    return {
      success,
      message,
      data,
    };
  }

  toListAcceptancesResponseDto(
    acceptances: TermAcceptanceResponseDto[],
  ): ListAcceptancesResponseDto {
    return { data: acceptances };
  }

  toCheckAllRequiredResponseDto(
    allAccepted: boolean,
    missing: string[],
    accepted: string[],
  ): CheckAllRequiredResponseDto {
    return {
      allAccepted,
      missing,
      accepted,
    };
  }
}
