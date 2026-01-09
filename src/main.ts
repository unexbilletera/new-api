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
    .setDescription('API for financial transaction management')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token in format: Bearer <token>',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'User authentication')
    .addTag('users', 'User profile and data management')
    .addTag('onboarding', 'Onboarding process and identity verification')
    .addTag('biometric', 'Biometric authentication and devices')
    .addTag('transactions', 'Financial transactions')
    .addTag('notifications', 'Push and system notifications')
    .addTag('campaigns', 'Campaigns and promotional codes')
    .addTag('terms', 'Terms and conditions of service')
    .addTag('actions', 'Application actions and features')
    .addTag('app-info', 'Application information')
    .addTag('backoffice-auth', 'Backoffice user authentication')
    .addTag('backoffice-users', 'Backoffice user management')
    .addTag('backoffice-clients', 'Client and account management')
    .addTag('backoffice-roles', 'Roles and permissions')
    .addTag('backoffice-onboarding', 'Onboarding management')
    .addTag('backoffice-actions', 'Action and permission management')
    .addTag('backoffice-system-config', 'System configuration')
    .addTag('backoffice-logs', 'System logs and audit')
    .addTag('health', 'API health check')
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
