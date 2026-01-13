import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  randomUUID,
  randomBytes,
  createPublicKey,
  createVerify,
  createHash,
  verify,
} from 'crypto';
const bcrypt = require('bcrypt');

import { PrismaService } from '../../../shared/prisma/prisma.service';
import { JwtService, JwtPayload } from '../../../shared/jwt/jwt.service';
import { NotificationService } from '../../../shared/notifications/notifications.service';
import { SmsService } from '../../../shared/sms/sms.service';
import {
  GenerateChallengeDto,
  VerifySignatureDto,
  RegisterDeviceDto,
  RegisterDeviceSoftDto,
  SendDeviceSmsValidationDto,
  VerifySmsChallengeDto,
  RevokeDeviceDto,
} from '../dto/biometric.dto';

const MIN_CHALLENGE_TTL_SECONDS = 30;
const DEFAULT_CHALLENGE_TTL_SECONDS = 180;

@Injectable()
export class BiometricService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
    private smsService: SmsService,
  ) {}

  private getChallengeTTLSeconds(): number {
    const envTTL = process.env.BIOMETRIC_CHALLENGE_TTL;
    if (envTTL) {
      const parsed = Number(envTTL);
      if (Number.isFinite(parsed) && parsed >= MIN_CHALLENGE_TTL_SECONDS) {
        return parsed;
      }
    }
    return DEFAULT_CHALLENGE_TTL_SECONDS;
  }

  private generateChallengeString(length: number = 32): string {
    return randomBytes(length).toString('base64');
  }

  private validatePublicKey(publicKeyPem: string): boolean {
    try {
      createPublicKey(publicKeyPem);
      return true;
    } catch {
      return false;
    }
  }

  private verifySignatureES256(
    publicKeyPem: string,
    challenge: string,
    signatureBase64: string,
    signatureFormat: string,
  ): boolean {
    try {
      const signature = Buffer.from(signatureBase64, 'base64');
      const digest = createHash('sha256').update(challenge).digest();

      if (signatureFormat === 'der') {
        return verify(null, digest, { key: publicKeyPem }, signature);
      } else {
        try {
          if (
            verify(
              null,
              digest,
              { key: publicKeyPem, dsaEncoding: 'ieee-p1363' },
              signature,
            )
          ) {
            return true;
          }
        } catch {}

        const p1363ToDer = (sig: Buffer): Buffer => {
          if (sig.length !== 64) throw new Error('Invalid P1363 length');
          const r = sig.subarray(0, 32);
          const s = sig.subarray(32, 64);
          const trimLeadingZeros = (buf: Buffer) => {
            let i = 0;
            while (i < buf.length - 1 && buf[i] === 0x00) i++;
            return buf.subarray(i);
          };
          const encodeInt = (buf: Buffer) => {
            const v = trimLeadingZeros(buf);
            const needsPad = (v[0] & 0x80) !== 0;
            const b = needsPad ? Buffer.concat([Buffer.from([0x00]), v]) : v;
            return Buffer.concat([Buffer.from([0x02, b.length]), b]);
          };
          const rInt = encodeInt(Buffer.from(r));
          const sInt = encodeInt(Buffer.from(s));
          const seqLen = rInt.length + sInt.length;
          return Buffer.concat([Buffer.from([0x30, seqLen]), rInt, sInt]);
        };

        try {
          const derSig = p1363ToDer(signature);
          return verify(null, digest, { key: publicKeyPem }, derSig);
        } catch {
          return false;
        }
      }
    } catch {
      return false;
    }
  }

  private verifySignatureRS256(
    publicKeyPem: string,
    challenge: string,
    signatureBase64: string,
  ): boolean {
    try {
      const signature = Buffer.from(signatureBase64, 'base64');
      const verifier = createVerify('sha256');
      verifier.update(challenge);
      verifier.end();
      return verifier.verify(publicKeyPem, signature);
    } catch {
      return false;
    }
  }

  private verifyBiometricSignature(
    publicKeyPem: string,
    keyType: string,
    challenge: string,
    signatureBase64: string,
    signatureFormat: string = 'der',
  ): boolean {
    if (keyType === 'ES256') {
      return this.verifySignatureES256(
        publicKeyPem,
        challenge,
        signatureBase64,
        signatureFormat,
      );
    } else if (keyType === 'RS256') {
      return this.verifySignatureRS256(
        publicKeyPem,
        challenge,
        signatureBase64,
      );
    }
    return false;
  }

  async generateChallenge(dto: GenerateChallengeDto) {
    const { userId, deviceId } = dto;

    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const device = await this.prisma.devices.findFirst({
      where: { userId, deviceIdentifier: deviceId, status: 'active' },
    });
    if (!device) {
      throw new NotFoundException('auth.errors.deviceNotFound');
    }

    const challenge = this.generateChallengeString();
    const challengeTTLSeconds = this.getChallengeTTLSeconds();
    const expiresAt = new Date(Date.now() + challengeTTLSeconds * 1000);

    const challengeRecord = await this.prisma.challenges.create({
      data: {
        id: randomUUID(),
        userId,
        deviceId: device.id,
        challenge,
        expiresAt,
      },
    });

    return {
      challengeId: challengeRecord.id,
      challenge,
      expiresIn: challengeTTLSeconds,
    };
  }

  async verifySignature(dto: VerifySignatureDto) {
    const {
      userId,
      deviceId,
      challengeId,
      signature,
      signatureFormat = 'der',
    } = dto;

    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const device = await this.prisma.devices.findFirst({
      where: { userId, deviceIdentifier: deviceId, status: 'active' },
    });
    if (!device) {
      throw new NotFoundException('auth.errors.deviceNotFound');
    }

    const challengeRecord = await this.prisma.challenges.findUnique({
      where: { id: challengeId },
    });
    if (!challengeRecord) {
      throw new NotFoundException('auth.errors.challengeNotFound');
    }

    if (new Date() > challengeRecord.expiresAt) {
      throw new UnauthorizedException('auth.errors.challengeExpired');
    }

    if (challengeRecord.used) {
      throw new UnauthorizedException('auth.errors.challengeAlreadyUsed');
    }

    if (
      challengeRecord.userId !== userId ||
      challengeRecord.deviceId !== device.id
    ) {
      throw new UnauthorizedException('auth.errors.invalidChallenge');
    }

    const isValid = this.verifyBiometricSignature(
      device.publicKeyPem,
      device.keyType,
      challengeRecord.challenge,
      signature,
      signatureFormat,
    );

    if (!isValid) {
      throw new UnauthorizedException('auth.errors.invalidSignature');
    }

    await this.prisma.challenges.update({
      where: { id: challengeId },
      data: { used: true, usedAt: new Date() },
    });

    await this.prisma.devices.update({
      where: { id: device.id },
      data: { lastUsedAt: new Date() },
    });

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email || '',
      roleId: user.id,
    };

    const accessToken = await this.jwtService.generateToken(payload);

    await this.prisma.users.update({
      where: { id: user.id },
      data: { accessToken },
    });

    return {
      accessToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    const {
      publicKeyPem,
      keyType,
      platform,
      attestation,
      deviceIdentifier,
      registrationType,
    } = dto;

    if (!['ES256', 'RS256'].includes(keyType)) {
      throw new BadRequestException('auth.errors.invalidKeyType');
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      throw new BadRequestException('auth.errors.invalidPlatform');
    }

    if (!this.validatePublicKey(publicKeyPem)) {
      throw new BadRequestException('auth.errors.invalidPublicKey');
    }

    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const type = registrationType || 'hard';
    const initialStatus = type === 'soft' ? 'active' : 'pending';

    if (type === 'soft') {
      await this.prisma.devices.updateMany({
        where: { userId, status: 'active' },
        data: { status: 'revoked', revokedAt: new Date() },
      });
    }

    const existingDevice = await this.prisma.devices.findFirst({
      where: { userId, deviceIdentifier },
      orderBy: { createdAt: 'desc' },
    });

    if (existingDevice) {
      if (existingDevice.status === 'active') {
        throw new BadRequestException('auth.errors.deviceAlreadyRegistered');
      }

      const updatedDevice = await this.prisma.devices.update({
        where: { id: existingDevice.id },
        data: {
          publicKeyPem,
          keyType,
          platform,
          attestation: attestation
            ? typeof attestation === 'string'
              ? JSON.parse(attestation)
              : attestation
            : undefined,
          status: initialStatus,
          revokedAt: null,
        },
      });

      return {
        deviceId: updatedDevice.id,
        status: initialStatus,
        registrationType: type,
        requiresSmsValidation: type === 'hard',
      };
    }

    const device = await this.prisma.devices.create({
      data: {
        id: randomUUID(),
        userId,
        deviceIdentifier,
        publicKeyPem,
        keyType,
        platform,
        attestation: attestation
          ? typeof attestation === 'string'
            ? JSON.parse(attestation)
            : attestation
          : undefined,
        status: initialStatus,
      },
    });

    return {
      deviceId: device.id,
      status: initialStatus,
      registrationType: type,
      requiresSmsValidation: type === 'hard',
    };
  }

  async registerDeviceSoft(userId: string, dto: RegisterDeviceSoftDto) {
    const { publicKeyPem, keyType, platform, attestation, deviceIdentifier } =
      dto;

    if (!['ES256', 'RS256'].includes(keyType)) {
      throw new BadRequestException('auth.errors.invalidKeyType');
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      throw new BadRequestException('auth.errors.invalidPlatform');
    }

    if (!this.validatePublicKey(publicKeyPem)) {
      throw new BadRequestException('auth.errors.invalidPublicKey');
    }

    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const existingDevice = await this.prisma.devices.findFirst({
      where: { userId, deviceIdentifier },
    });

    if (existingDevice && existingDevice.status === 'active') {
      throw new BadRequestException('auth.errors.deviceAlreadyRegistered');
    }

    await this.prisma.devices.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'revoked', revokedAt: new Date() },
    });

    const device = await this.prisma.devices.create({
      data: {
        id: randomUUID(),
        userId,
        deviceIdentifier,
        publicKeyPem,
        keyType,
        platform,
        attestation: attestation
          ? typeof attestation === 'string'
            ? JSON.parse(attestation)
            : attestation
          : undefined,
        status: 'active',
      },
    });

    return {
      deviceId: device.id,
      status: 'active',
      registrationType: 'soft',
      message: 'Device registered and activated successfully (SOFT)',
    };
  }

  async sendDeviceSmsValidation(
    userId: string,
    dto: SendDeviceSmsValidationDto,
  ) {
    const { deviceId } = dto;

    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const device = await this.prisma.devices.findFirst({
      where: { id: deviceId, userId, status: 'pending' },
    });
    if (!device) {
      throw new NotFoundException('auth.errors.deviceNotFoundOrNotPending');
    }

    if (!user.phone) {
      throw new BadRequestException('users.errors.phoneRequired');
    }

    const result = await this.smsService.sendValidationCode(
      user.phone,
      6,
      5,
      'sms',
      user.language || undefined,
    );

    return {
      success: result.success,
      message: result.message,
      phone: result.phone,
      expiresIn: result.expiresIn,
      debug: result.debug,
    };
  }

  async verifySmsAndActivate(userId: string, dto: VerifySmsChallengeDto) {
    const { deviceId, code } = dto;

    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const device = await this.prisma.devices.findFirst({
      where: { id: deviceId, userId, status: 'pending' },
    });
    if (!device) {
      throw new NotFoundException('auth.errors.deviceNotFoundOrNotPending');
    }

    if (!user.phone) {
      throw new BadRequestException('users.errors.phoneRequired');
    }

    try {
      await this.smsService.verifyCode(user.phone, code, false);

      await this.prisma.devices.updateMany({
        where: { userId, status: 'active' },
        data: { status: 'revoked', revokedAt: new Date() },
      });

      await this.prisma.devices.update({
        where: { id: device.id },
        data: { status: 'active' },
      });

      const normalizedPhone = this.smsService.normalizePhone(user.phone);
      await this.prisma.phone_validation_codes.deleteMany({
        where: { phone: normalizedPhone },
      });

      return {
        success: true,
        message: 'Device activated successfully',
        deviceId: device.id,
        status: 'active',
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Code not found or expired') {
          throw new BadRequestException('auth.errors.codeNotFound');
        }
        if (error.message === 'Invalid code') {
          throw new UnauthorizedException('auth.errors.invalidSmsCode');
        }
      }
      throw error;
    }
  }

  async revokeDevice(userId: string, dto: RevokeDeviceDto) {
    const { deviceId } = dto;

    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const device = await this.prisma.devices.findFirst({
      where: { userId, id: deviceId, status: { in: ['pending', 'active'] } },
    });
    if (!device) {
      throw new NotFoundException('auth.errors.deviceNotFound');
    }

    await this.prisma.devices.update({
      where: { id: device.id },
      data: { status: 'revoked', revokedAt: new Date() },
    });

    await this.prisma.challenges.updateMany({
      where: { deviceId: device.id, used: false },
      data: { used: true, usedAt: new Date() },
    });

    return { status: 'revoked' };
  }

  async listUserDevices(userId: string) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const devices = await this.prisma.devices.findMany({
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

    return devices.map((device) => ({
      deviceId: device.id,
      deviceIdentifier: device.deviceIdentifier,
      platform: device.platform,
      keyType: device.keyType,
      status: device.status,
      registeredAt: device.createdAt,
      lastUsedAt: device.lastUsedAt,
      userId,
    }));
  }

  async checkDeviceHealth(userId: string, deviceIdentifier: string) {
    const activeDevice = await this.prisma.devices.findFirst({
      where: { userId, deviceIdentifier, status: 'active', revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (activeDevice) {
      await this.prisma.devices.update({
        where: { id: activeDevice.id },
        data: { lastUsedAt: new Date() },
      });

      return {
        isValid: true,
        status: 'active',
        deviceId: activeDevice.id,
      };
    }

    const device = await this.prisma.devices.findFirst({
      where: { userId, deviceIdentifier },
      orderBy: { createdAt: 'desc' },
    });

    if (device && (device.status === 'revoked' || device.revokedAt)) {
      return {
        isValid: false,
        status: 'revoked',
        error: 'auth.errors.deviceRevoked',
        message: 'Your account was accessed on another device.',
        canRegister: true,
        deviceId: device.id,
      };
    }

    return {
      isValid: false,
      status: 'not_found',
      error: 'auth.errors.deviceNotFound',
      message: 'Device not found or not active. Device registration required.',
    };
  }

  private generateNumericCode(length: number = 6): string {
    return parseInt(randomBytes(length).toString('hex'), 16)
      .toString()
      .substring(0, length)
      .padStart(length, '0');
  }
}
