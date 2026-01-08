import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config.service';

/**
 * Módulo de configuração global
 * Mapeia variáveis de ambiente WALLET_* para nomes mais padrão
 */
@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}

