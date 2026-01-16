import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import {
  randomBytes,
  createPublicKey,
  createVerify,
  createHash,
  verify,
} from 'crypto';
import { DeviceModel } from '../models/device.model';
import { BiometricMapper } from '../mappers/biometric.mapper';
import { JwtService, JwtPayload } from '../../../shared/jwt/jwt.service';
import { SmsService } from '../../../shared/sms/sms.service';
import {
  GenerateChallengeDto,
  VerifySignatureDto,
  VerifySmsChallengeDto,
} from '../dto/biometric.dto';

const MIN_CHALLENGE_TTL_SECONDS = 30;
const DEFAULT_CHALLENGE_TTL_SECONDS = 180;

@Injectable()
export class ChallengeVerificationService {
  constructor(
    private deviceModel: DeviceModel,
    private biometricMapper: BiometricMapper,
    private jwtService: JwtService,
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

  async generateChallenge(dto: GenerateChallengeDto) {
    const { userId, deviceId } = dto;

    const user = await this.deviceModel.findUserById(userId);
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const device = await this.deviceModel.findDeviceByIdAndUser(
      deviceId,
      userId,
      'active',
    );
    if (!device) {
      throw new NotFoundException('auth.errors.deviceNotFound');
    }

    const challenge = this.generateChallengeString();
    const challengeTTLSeconds = this.getChallengeTTLSeconds();
    const expiresAt = new Date(Date.now() + challengeTTLSeconds * 1000);

    const challengeRecord = await this.deviceModel.createChallenge({
      userId,
      deviceId: device.id,
      challenge,
      expiresAt,
    });

    return this.biometricMapper.toGenerateChallengeResponseDto(
      challengeRecord.id,
      challenge,
      challengeTTLSeconds,
    );
  }

  async verifySignature(dto: VerifySignatureDto) {
    const {
      userId,
      deviceId,
      challengeId,
      signature,
      signatureFormat = 'der',
    } = dto;

    const user = await this.deviceModel.findUserById(userId);
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const device = await this.deviceModel.findDeviceByIdAndUser(
      deviceId,
      userId,
      'active',
    );
    if (!device) {
      throw new NotFoundException('auth.errors.deviceNotFound');
    }

    const challengeRecord =
      await this.deviceModel.findChallengeById(challengeId);
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

    await this.deviceModel.updateChallenge(challengeId, {
      used: true,
      usedAt: new Date(),
    });

    await this.deviceModel.updateDevice(device.id, { lastUsedAt: new Date() });

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email || '',
      roleId: user.id,
    };

    const accessToken = await this.jwtService.generateToken(payload);

    await this.deviceModel.updateUserAccessToken(user.id, accessToken);

    return this.biometricMapper.toVerifySignatureResponseDto(
      accessToken,
      3600,
      user,
    );
  }

  async verifySmsAndActivate(userId: string, dto: VerifySmsChallengeDto) {
    const { deviceId, code } = dto;

    const user = await this.deviceModel.findUserById(userId);
    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const device = await this.deviceModel.findPendingDevice(deviceId, userId);
    if (!device) {
      throw new NotFoundException('auth.errors.deviceNotFoundOrNotPending');
    }

    if (!user.phone) {
      throw new BadRequestException('users.errors.phoneRequired');
    }

    try {
      await this.smsService.verifyCode(user.phone, code, false);

      await this.deviceModel.updateDevicesByUserStatus(
        userId,
        'active',
        'revoked',
        new Date(),
      );

      await this.deviceModel.updateDevice(device.id, { status: 'active' });

      const normalizedPhone = this.smsService.normalizePhone(user.phone);
      await this.deviceModel.deletePhoneValidationCodes(normalizedPhone);

      return this.biometricMapper.toVerifySmsChallengeResponseDto(device.id);
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
}
