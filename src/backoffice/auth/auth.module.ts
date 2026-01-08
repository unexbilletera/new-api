import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { BackofficeUserModel } from './models/backoffice-user.model';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';
import { BackofficeAuthGuard } from '../../shared/guards/backoffice-auth.guard';
import { LoggerModule } from '../../shared/logger/logger.module';
import { AccessLogModule } from '../../shared/access-log/access-log.module';
import { BruteForceService } from '../../shared/security/brute-force.service';
import { RateLimiterService } from '../../shared/security/rate-limiter.service';

@Module({
  imports: [PrismaModule, JwtModule, LoggerModule, AccessLogModule],
  controllers: [AuthController],
  providers: [AuthService, BackofficeUserModel, BackofficeAuthGuard, BruteForceService, RateLimiterService],
  exports: [AuthService],
})
export class BackofficeAuthModule {}

