import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';

/**
 * Módulo de conversão de moedas (área logada)
 * Responsável por: conversões, cotações, múltiplas moedas
 */
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class SecureExchangeModule {}

