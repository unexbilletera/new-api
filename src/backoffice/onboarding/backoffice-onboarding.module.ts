import { Module } from '@nestjs/common';
import { OnboardingController } from './controllers/onboarding.controller';
import { OnboardingService } from './services/onboarding.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';
import { CronosModule } from '../../shared/cronos/cronos.module';
import { BindModule } from '../../shared/bind/bind.module';
import { MantecaModule } from '../../shared/manteca/manteca.module';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [PrismaModule, JwtModule, CronosModule, BindModule, MantecaModule, LoggerModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class BackofficeOnboardingModule {}
