import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  ListOnboardingQueryDto,
  RejectUserDto,
  ApproveUserDto,
  RequestCorrectionDto,
  OnboardingUserDto,
} from '../dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}  async listUsers(query: ListOnboardingQueryDto): Promise<{
    data: OnboardingUserDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      status: query.status || 'pending',
    };

    if (query.country) {
      where.country = query.country;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          usersIdentities_usersIdentities_userIdTousers: {
            where: { deletedAt: null },
            select: {
              id: true,
              country: true,
              status: true,
              type: true,
            },
          },
        },
      }),
      this.prisma.users.count({ where }),
    ]);

    return {
      data: data.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        onboardingState: user.onboardingState,
        country: user.country,
        createdAt: user.createdAt,
        identities: user.usersIdentities_usersIdentities_userIdTousers,
      })),
      total,
      page,
      limit,
    };
  }  async getUserDetails(userId: string) {
    const user = await this.prisma.users.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        usersIdentities_usersIdentities_userIdTousers: {
          where: { deletedAt: null },
        },
        usersAccounts: {
          where: { deletedAt: null },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      onboardingState: user.onboardingState,
      country: user.country,
      createdAt: user.createdAt,
      identities: user.usersIdentities_usersIdentities_userIdTousers,
      accounts: user.usersAccounts,
    };
  }  async getPendingUsers(query: ListOnboardingQueryDto) {
    return this.listUsers({ ...query, status: 'pending' });
  }  async approveUser(userId: string, dto: ApproveUserDto): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.users.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.status !== 'pending' && user.status !== 'process') {
      throw new BadRequestException('Usuário não está em processo de onboarding');
    }

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        status: 'enable',
        updatedAt: new Date(),
      },
    });

    await this.prisma.usersIdentities.updateMany({
      where: { userId, status: 'pending' },
      data: { status: 'enable', updatedAt: new Date() },
    });

    return { success: true, message: 'Usuário aprovado com sucesso' };
  }  async rejectUser(userId: string, dto: RejectUserDto): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.users.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const currentState = (user.onboardingState as any) || {};
    const newState = {
      ...currentState,
      needsCorrection: dto.stepsToCorrect,
      rejectionReason: dto.reason,
      rejectedAt: new Date(),
    };

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        status: 'error',
        onboardingState: newState,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Usuário rejeitado, aguardando correções' };
  }  async requestCorrection(userId: string, dto: RequestCorrectionDto): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.users.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const currentState = (user.onboardingState as any) || {};
    const newState = {
      ...currentState,
      needsCorrection: dto.stepsToCorrect,
      correctionMessage: dto.message,
      correctionRequestedAt: new Date(),
    };

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        onboardingState: newState,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Correção solicitada com sucesso' };
  }  async updateUserInfo(userId: string, data: any): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.users.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const updateData: any = { updatedAt: new Date() };
    
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;

    await this.prisma.users.update({
      where: { id: userId },
      data: updateData,
    });

    return { success: true, message: 'Informações atualizadas com sucesso' };
  }
}
