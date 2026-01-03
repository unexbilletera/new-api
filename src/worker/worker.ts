import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

/**
 * Worker principal
 * Processa mensagens da fila SQS e atualiza status de transações
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);

  // TODO: Implementar consumo de fila SQS
  console.log('⚙️  Worker iniciado. Aguardando mensagens da fila...');

  // Mantém o worker rodando
  process.on('SIGTERM', async () => {
    console.log('🛑 Encerrando worker...');
    await app.close();
    process.exit(0);
  });
}

bootstrap();

