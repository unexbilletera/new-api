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
    .addTag('1. Public - Authentication', 'User authentication and registration')
    .addTag('1. Public - Security', 'Security tokens for public operations')
    .addTag('1. Public - Users', 'User profile and data management')
    .addTag('1. Public - Onboarding', 'Onboarding process and identity verification')
    .addTag('1. Public - Biometric', 'Biometric authentication and devices')
    .addTag('2. Secure - Transactions', 'Financial transactions (PIX, transfers)')
    .addTag('2. Secure - Notifications', 'Push and system notifications')
    .addTag('2. Secure - Campaigns', 'Campaigns and promotional codes')
    .addTag('2. Secure - Terms', 'Terms and conditions of service')
    .addTag('2. Secure - Actions', 'Application actions and features')
    .addTag('2. Secure - App Info', 'Application information and settings')
    .addTag('3. Backoffice - Authentication', 'Backoffice user authentication')
    .addTag('3. Backoffice - Users', 'Backoffice user management')
    .addTag('3. Backoffice - Clients', 'Client and account management')
    .addTag('3. Backoffice - Roles', 'Roles and permissions')
    .addTag('3. Backoffice - Onboarding', 'Onboarding management')
    .addTag('3. Backoffice - Actions', 'Action and permission management')
    .addTag('3. Backoffice - System Config', 'System configuration')
    .addTag('3. Backoffice - Logs', 'System logs and audit')
    .addTag('4. Health', 'API health check')
    .addTag('5. Shared', 'Shared utilities and root endpoints')
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
