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
  const fastifyAdapter = new FastifyAdapter({
    bodyLimit: 1048576, // 1MB
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  const instance = app.getHttpAdapter().getInstance();

  instance.addHook('preParsing', async (request: any, _reply: any, payload: any) => {
    if (request.url && request.url.includes('/webhook')) {
      const chunks: Buffer[] = [];

      for await (const chunk of payload) {
        chunks.push(chunk);
      }

      const rawBody = Buffer.concat(chunks).toString('utf8');
      request.rawBody = rawBody;

      return Buffer.from(rawBody);
    }

    return payload;
  });

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
    .addTag(
      '1.1 Public - Authentication',
      'User authentication and registration',
    )
    .addTag('1.1 Public - Security', 'Security tokens for public operations')
    .addTag('1.2 Public - Users', 'User profile and data management')
    .addTag(
      '1.3 Public - Onboarding',
      'Onboarding process and identity verification',
    )
    .addTag('1.3 Public - Biometric', 'Biometric authentication and devices')
    .addTag(
      '2.1 Secure - Transactions',
      'Financial transactions (PIX, transfers)',
    )
    .addTag('2.2 Secure - Notifications', 'Push and system notifications')
    .addTag('2.2 Secure - Campaigns', 'Campaigns and promotional codes')
    .addTag('2.3 Secure - Terms', 'Terms and conditions of service')
    .addTag('2.3 Secure - Actions', 'Application actions and features')
    .addTag('2.3 Secure - App Info', 'Application information and settings')
    .addTag('3.1 Backoffice - Authentication', 'Backoffice user authentication')
    .addTag('3.2 Backoffice - Users', 'Backoffice user management')
    .addTag('3.2 Backoffice - Clients', 'Client and account management')
    .addTag('3.1 Backoffice - Roles', 'Roles and permissions')
    .addTag('3.3 Backoffice - Onboarding', 'Onboarding management')
    .addTag('3.3 Backoffice - Actions', 'Action and permission management')
    .addTag('3.3 Backoffice - System Config', 'System configuration')
    .addTag('3.3 Backoffice - Logs', 'System logs and audit')
    .addTag('4 Health', 'API health check')
    .addTag('5 Shared', 'Shared utilities and root endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = parseInt(
    process.env.PORT || process.env.WALLET_SERVER_PORT || '3000',
    10,
  );
  await app.listen(port, '0.0.0.0');
  logger.info(`API running on http://0.0.0.0:${port}`);
  logger.info(
    `Swagger documentation available at http://0.0.0.0:${port}/api/docs`,
  );
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
