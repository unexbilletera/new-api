import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class DeviceModel {
  constructor(private prisma: PrismaService) {}

  async findUserById(userId: string) {
    return this.prisma.users.findFirst({
      where: { id: userId },
    });
  }

  async findDeviceByUserAndIdentifier(
    userId: string,
    deviceIdentifier: string,
  ) {
    return this.prisma.devices.findFirst({
      where: { userId, deviceIdentifier },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDeviceByIdAndUser(
    deviceId: string,
    userId: string,
    status?: string,
  ) {
    const where: any = { id: deviceId, userId };
    if (status) {
      where.status = status;
    }
    return this.prisma.devices.findFirst({ where });
  }

  async findActiveDeviceByUserAndIdentifier(
    userId: string,
    deviceIdentifier: string,
  ) {
    return this.prisma.devices.findFirst({
      where: { userId, deviceIdentifier, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingDevice(deviceId: string, userId: string) {
    return this.prisma.devices.findFirst({
      where: { id: deviceId, userId, status: 'pending' },
    });
  }

  async findActiveDevicesByUser(userId: string) {
    return this.prisma.devices.findMany({
      where: { userId, status: { not: 'revoked' } },
      select: {
        id: true,
        deviceIdentifier: true,
        keyType: true,
        platform: true,
        status: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDevice(data: {
    userId: string;
    deviceIdentifier: string;
    publicKeyPem: string;
    keyType: string;
    platform: string;
    attestation?: any;
    status: 'pending' | 'active' | 'revoked';
  }) {
    return this.prisma.devices.create({
      data: {
        id: randomUUID(),
        userId: data.userId,
        deviceIdentifier: data.deviceIdentifier,
        publicKeyPem: data.publicKeyPem,
        keyType: data.keyType,
        platform: data.platform,
        attestation: data.attestation
          ? typeof data.attestation === 'string'
            ? JSON.parse(data.attestation)
            : data.attestation
          : undefined,
        status: data.status,
      },
    });
  }

  async updateDevice(deviceId: string, data: any) {
    return this.prisma.devices.update({
      where: { id: deviceId },
      data,
    });
  }

  async updateDevicesByUserStatus(
    userId: string,
    currentStatus: 'pending' | 'active' | 'revoked',
    newStatus: 'pending' | 'active' | 'revoked',
    revokedAt?: Date,
  ) {
    return this.prisma.devices.updateMany({
      where: { userId, status: currentStatus },
      data: { status: newStatus, ...(revokedAt && { revokedAt }) },
    });
  }

  async findChallengeById(challengeId: string) {
    return this.prisma.challenges.findFirst({
      where: { id: challengeId },
    });
  }

  async createChallenge(data: {
    userId: string;
    deviceId: string;
    challenge: string;
    expiresAt: Date;
  }) {
    return this.prisma.challenges.create({
      data: {
        id: randomUUID(),
        ...data,
      },
    });
  }

  async updateChallenge(challengeId: string, data: any) {
    return this.prisma.challenges.update({
      where: { id: challengeId },
      data,
    });
  }

  async invalidateChallengesByDevice(deviceId: string) {
    return this.prisma.challenges.updateMany({
      where: { deviceId, used: false },
      data: { used: true, usedAt: new Date() },
    });
  }

  async deletePhoneValidationCodes(phone: string) {
    return this.prisma.phone_validation_codes.deleteMany({
      where: { phone },
    });
  }

  async updateUserAccessToken(userId: string, accessToken: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { accessToken },
    });
  }
}
