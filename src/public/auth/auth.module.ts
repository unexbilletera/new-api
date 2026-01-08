import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';
import { TestAuthController } from './controllers/test-auth.controller';

/**
 * Módulo de autenticação pública (não logado)
 * Responsável por: login, registro, recuperação de senha
 */
@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [TestAuthController], // ⚠️ TEMPORÁRIO - remover em produção
  providers: [],
  exports: [],
})
export class PublicAuthModule {}
