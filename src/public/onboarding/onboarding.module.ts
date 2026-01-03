import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';

/**
 * Módulo de onboarding público
 * Responsável por: cadastro inicial, validações, KYC
 */
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class PublicOnboardingModule {}

