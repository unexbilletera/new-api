import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { LoggerService } from './shared/logger/logger.service';
import { loadEnvironmentFile } from './shared/config/env-loader';

// Carrega variáveis de ambiente ANTES de inicializar a aplicação
loadEnvironmentFile();

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const logger = app.get(LoggerService);
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  app.enableCors();

  const port = parseInt(process.env.PORT || process.env.WALLET_SERVER_PORT || '3000', 10);
  await app.listen(port, '0.0.0.0');
  logger.info(`API running on http://0.0.0.0:${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
