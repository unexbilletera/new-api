import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { LoggerService } from '../shared/logger/logger.service';

/**
 * Worker principal
 * Processa mensagens da fila SQS e atualiza status de transações
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  const logger = app.get(LoggerService);

  // TODO: Implementar consumo de fila SQS
  logger.info('Worker started. Waiting for messages from queue...');

  // Mantém o worker rodando
  process.on('SIGTERM', async () => {
    logger.info('Shutting down worker...');
    await app.close();
    process.exit(0);
  });
}

bootstrap();

