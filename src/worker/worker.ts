import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { LoggerService } from '../shared/logger/logger.service';
import { WorkerService } from './worker.service';
import { loadEnvironmentFile } from '../shared/config/env-loader';

/**
 * Worker principal
 * Processa mensagens da fila SQS e atualiza status de transações
 */
async function bootstrap() {
  // Carrega variáveis de ambiente
  loadEnvironmentFile();

  const app = await NestFactory.createApplicationContext(WorkerModule);
  const logger = app.get(LoggerService);
  const workerService = app.get(WorkerService);

  logger.info('Worker iniciando...');
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Inicia o worker
  workerService.start().catch((error) => {
    logger.error(`Erro fatal no worker: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  });

  // Tratamento de sinais para shutdown graceful
  const shutdown = async (signal: string) => {
    logger.info(`Recebido sinal ${signal}. Encerrando worker...`);
    workerService.stop();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Tratamento de erros não capturados
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  });

  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    shutdown('uncaughtException');
  });
}

bootstrap();

