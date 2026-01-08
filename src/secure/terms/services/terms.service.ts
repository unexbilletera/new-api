import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  AcceptTermDto,
  ServiceType,
  TermAcceptanceResponseDto,
  TermCheckResponseDto,
} from '../dto/terms.dto';

@Injectable()
export class TermsService {
  constructor(private prisma: PrismaService) {}

  async check(userId: string, serviceType: ServiceType): Promise<TermCheckResponseDto> {
    const acceptance = await this.prisma.user_term_acceptances.findFirst({
      where: {
        userId,
        serviceType,
      },
      orderBy: { acceptedAt: 'desc' },
    });

    if (!acceptance) {
      return {
        accepted: false,
        serviceType,
      };
    }

    return {
      accepted: true,
      serviceType,
      acceptedAt: acceptance.acceptedAt,
    };
  }

  async accept(
    userId: string,
    dto: AcceptTermDto,
    ipAddress?: string,
  ): Promise<{ success: boolean; message: string; data?: TermAcceptanceResponseDto }> {

    const existing = await this.prisma.user_term_acceptances.findFirst({
      where: {
        userId,
        serviceType: dto.serviceType,
      },
    });

    if (existing) {

      return {
        success: true,
        message: 'Termo já aceito anteriormente',
        data: {
          id: existing.id,
          userId: existing.userId,
          serviceType: existing.serviceType,
          acceptedAt: existing.acceptedAt,
          ipAddress: existing.ipAddress || undefined,
        },
      };
    }

    const acceptance = await this.prisma.user_term_acceptances.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        serviceType: dto.serviceType,
        acceptedAt: new Date(),
        ipAddress: ipAddress || null,
      },
    });

    return {
      success: true,
      message: 'Termo aceito com sucesso',
      data: {
        id: acceptance.id,
        userId: acceptance.userId,
        serviceType: acceptance.serviceType,
        acceptedAt: acceptance.acceptedAt,
        ipAddress: acceptance.ipAddress || undefined,
      },
    };
  }

  async listAcceptances(userId: string): Promise<TermAcceptanceResponseDto[]> {
    const acceptances = await this.prisma.user_term_acceptances.findMany({
      where: { userId },
      orderBy: { acceptedAt: 'desc' },
    });

    return acceptances.map((a) => ({
      id: a.id,
      userId: a.userId,
      serviceType: a.serviceType,
      acceptedAt: a.acceptedAt,
      ipAddress: a.ipAddress || undefined,
    }));
  }

  async checkAllRequired(userId: string): Promise<{
    allAccepted: boolean;
    missing: string[];
    accepted: string[];
  }> {

    const requiredTerms = [ServiceType.MANTECA_PIX, ServiceType.MANTECA_EXCHANGE];

    const acceptances = await this.prisma.user_term_acceptances.findMany({
      where: {
        userId,
        serviceType: { in: requiredTerms },
      },
      select: { serviceType: true },
    });

    const acceptedTypes = acceptances.map((a) => a.serviceType);
    const missing = requiredTerms.filter((t) => !acceptedTypes.includes(t));

    return {
      allAccepted: missing.length === 0,
      missing,
      accepted: acceptedTypes,
    };
  }
}
