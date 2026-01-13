import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthUserModel } from '../models/user.model';
import { PasswordHelper } from '../../../shared/helpers/password.helper';
import { JwtService, JwtPayload } from '../../../shared/jwt/jwt.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { SystemVersionService } from '../../../shared/helpers/system-version.service';
import { AccessLogService } from '../../../shared/access-log/access-log.service';
import { CronosService } from '../../../shared/cronos/cronos.service';
import { AuthMapper } from '../mappers/auth.mapper';
import { SigninDto } from '../dto/signin.dto';
import { LoggerService } from '../../../shared/logger/logger.service';
import { BruteForceService } from '../../../shared/security/brute-force.service';
import { SuspiciousActivityService } from '../../../shared/security/suspicious-activity.service';

@Injectable()
export class SigninService {
  constructor(
    private userModel: AuthUserModel,
    private jwtService: JwtService,
    private systemVersionService: SystemVersionService,
    private accessLogService: AccessLogService,
    private cronosService: CronosService,
    private prisma: PrismaService,
    private authMapper: AuthMapper,
    private logger: LoggerService,
    private bruteForceService: BruteForceService,
    private suspiciousActivityService: SuspiciousActivityService,
  ) {}

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  async signin(
    dto: SigninDto,
    requestContext?: { ipAddress?: string; userAgent?: string },
  ) {
    try {
      this.systemVersionService.assertVersionValid(dto.systemVersion);
    } catch (versionError) {
      throw new BadRequestException(
        versionError instanceof Error
          ? versionError.message
          : 'users.errors.invalidSystemVersion',
      );
    }

    const identifier = (dto.identifier || (dto as any).email || '').trim();

    if (!identifier) {
      throw new BadRequestException('users.errors.invalidUsername');
    }

    const usernameRegex = /^[A-Za-z0-9]{1,}[\-\_\.]?[A-Za-z0-9]{4,}$/;
    const emailRegex =
      /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (identifier.length > 255) {
      throw new BadRequestException('users.errors.invalidUsername');
    }

    if (!usernameRegex.test(identifier) && !emailRegex.test(identifier)) {
      throw new BadRequestException('users.errors.invalidUsername');
    }

    const where = identifier.includes('@')
      ? { email: this.normalizeEmail(identifier) }
      : { username: identifier.toLowerCase() };

    const user = await this.prisma.users.findFirst({
      where: {
        ...where,
        status: { in: ['pending', 'enable', 'error'] },
        access: {
          in: ['administrator', 'supervisor', 'operator', 'customer', 'user'],
        },
      },
    });

    const ipAddress = requestContext?.ipAddress;
    const userAgent = requestContext?.userAgent;

    const bruteForceCheck = await this.bruteForceService.checkAttempt(
      identifier,
      ipAddress,
      {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
        lockoutDurationMs: 30 * 60 * 1000,
      },
    );

    if (!bruteForceCheck.allowed) {
      throw new HttpException(
        'users.errors.tooManyAttempts',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!user) {
      await this.bruteForceService.recordFailure(
        identifier,
        undefined,
        ipAddress,
      );
      throw new UnauthorizedException('users.errors.invalidUsernameOrPassword');
    }

    if (user.status === 'disable') {
      await this.bruteForceService.recordFailure(
        identifier,
        user.id,
        ipAddress,
      );
      await this.accessLogService.logFailure({
        userId: user.id,
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });
      throw new UnauthorizedException('users.errors.accountLocked');
    }

    if (!user.password) {
      await this.bruteForceService.recordFailure(
        identifier,
        user.id,
        ipAddress,
      );
      await this.accessLogService.logFailure({
        userId: user.id,
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });
      throw new UnauthorizedException('users.errors.invalidUsernameOrPassword');
    }

    const isPasswordValid = await PasswordHelper.compare(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      await this.bruteForceService.recordFailure(
        identifier,
        user.id,
        ipAddress,
      );
      await this.accessLogService.logFailure({
        userId: user.id,
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });
      throw new UnauthorizedException('users.errors.invalidUsernameOrPassword');
    }

    let deviceRequired = false;
    if (dto.deviceIdentifier) {
      const activeDevice = await this.prisma.devices.findFirst({
        where: {
          userId: user.id,
          deviceIdentifier: dto.deviceIdentifier,
          status: 'active',
        },
      });
      deviceRequired = !activeDevice;
    } else {
      const anyActiveDevice = await this.prisma.devices.findFirst({
        where: { userId: user.id, status: 'active' },
      });
      deviceRequired = !anyActiveDevice;
    }

    if (deviceRequired) {
      const tempPayload: JwtPayload = {
        userId: user.id,
        email: user.email || identifier,
        roleId: user.id,
      };
      const tempToken = await this.jwtService.generateToken(tempPayload);
      return this.authMapper.toSigninDeviceRequiredResponseDto(
        user,
        tempToken,
        'hard',
      );
    }

    await this.bruteForceService.clearAttempts(identifier, ipAddress);

    try {
      const userIdentities = await this.userModel.getUserIdentities(user.id);
      const userAccounts = await this.userModel.getUserAccounts(user.id);

      await this.cronosService.syncCronosBalance({
        userId: user.id,
        userIdentities: userIdentities.map((id: any) => ({
          country: id.country || '',
          status: id.status || '',
          taxDocumentNumber: id.taxDocumentNumber || '',
        })),
        userAccounts: userAccounts.map((acc: any) => ({
          id: acc.id,
          type: acc.type || '',
          status: acc.status || '',
          balance: acc.balance || '0',
        })),
      });
    } catch (syncError: any) {
      this.logger.warn('Cronos sync error (non-blocking)', {
        error: syncError?.message,
      });
    }

    await this.accessLogService.logSuccess({
      userId: user.id,
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
    });

    this.suspiciousActivityService
      .checkLoginActivity(
        user.id,
        SuspiciousActivityService.extractFingerprint(
          userAgent,
          ipAddress,
          dto.deviceIdentifier,
        ),
      )
      .catch((error) => {
        this.logger.warn('Suspicious activity check failed', {
          error: error?.message,
        });
      });

    await this.userModel.updateLastLogin(user.id);

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email || identifier,
      roleId: user.id,
    };

    const token = await this.jwtService.generateToken(payload);

    return this.authMapper.toSigninResponseDto(user, token);
  }
}
