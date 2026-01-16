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

  // Configurar raw body para webhooks usando hook preParsing
  // Este hook captura o raw body antes do parser padrão processar
  const instance = app.getHttpAdapter().getInstance();
  
  instance.addHook('preParsing', async (request, reply, payload) => {
    // Apenas para rotas de webhook
    if (request.url && request.url.includes('/webhook')) {
      const chunks: Buffer[] = [];
      
      // Ler o stream e salvar raw body
      for await (const chunk of payload) {
        chunks.push(chunk);
      }
      
      const rawBody = Buffer.concat(chunks).toString('utf8');
      (request as any).rawBody = rawBody;
      
      // Retornar o payload como Buffer para que o parser padrão possa processar
      return Buffer.from(rawBody);
    }
    
    // Para outras rotas, retornar payload original
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

  // Configurar Swagger/OpenAPI
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
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('transactions', 'Endpoints relacionados a transações')
    .addTag('auth', 'Endpoints de autenticação')
    .addTag('backoffice', 'Endpoints do backoffice')
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
