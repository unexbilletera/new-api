import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { LoggerService } from './shared/logger/logger.service';
import { loadEnvironmentFile } from './shared/config/env-loader';

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

  const config = new DocumentBuilder()
    .setTitle('Unex API')
    .setDescription('API para gerenciamento de transações financeiras')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT no formato: Bearer <token>',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Autenticação de usuários')
    .addTag('users', 'Gestão de perfil e dados de usuários')
    .addTag('onboarding', 'Processo de onboarding e verificação de identidade')
    .addTag('biometric', 'Autenticação biométrica e dispositivos')
    .addTag('transactions', 'Transações financeiras')
    .addTag('notifications', 'Notificações push e do sistema')
    .addTag('campaigns', 'Campanhas e códigos promocionais')
    .addTag('terms', 'Termos e condições de serviço')
    .addTag('actions', 'Ações e funcionalidades do aplicativo')
    .addTag('app-info', 'Informações da aplicação')
    .addTag('backoffice-auth', 'Autenticação de usuários backoffice')
    .addTag('backoffice-users', 'Gestão de usuários backoffice')
    .addTag('backoffice-clients', 'Gestão de clientes e contas')
    .addTag('backoffice-roles', 'Papéis e permissões')
    .addTag('backoffice-onboarding', 'Gerenciamento de onboarding')
    .addTag('backoffice-actions', 'Gestão de ações e permissões')
    .addTag('backoffice-system-config', 'Configurações do sistema')
    .addTag('backoffice-logs', 'Logs e auditoria do sistema')
    .addTag('health', 'Health check da API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = parseInt(process.env.PORT || process.env.WALLET_SERVER_PORT || '3000', 10);
  await app.listen(port, '0.0.0.0');
  logger.info(`API running on http://0.0.0.0:${port}`);
  logger.info(`Swagger documentation available at http://0.0.0.0:${port}/api/docs`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
