import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';

/**
 * Módulo de usuários público
 * Responsável por: perfil público, validações de email/SMS
 */
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class PublicUsersModule {}

