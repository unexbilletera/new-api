import { Module } from '@nestjs/common';
// PrismaModule é global, não precisa ser importado explicitamente
// Mas mantemos o import para clareza e para evitar problemas de dependência

/**
 * Módulo de webhooks
 * Responsável por: receber eventos externos, salvar na fila
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class WebhooksModule {}

