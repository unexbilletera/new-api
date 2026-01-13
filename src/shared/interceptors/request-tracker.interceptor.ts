import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class RequestTrackerInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    const startTime = Date.now();
    const method = request.method;
    const url = request.url;
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.socket?.remoteAddress ||
      'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    this.logger.info('📥 Request received', {
      method,
      url,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode || 200;

          let responseCode: string | number | undefined;
          if (data && typeof data === 'object') {
            if ('code' in data && typeof data.code === 'string') {
              responseCode = data.code;
            } else if ('error' in data && typeof data.error === 'string') {
              responseCode = data.error;
            }
          }

          this.logger.info('Request completed', {
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            responseCode: responseCode || statusCode,
            ip,
            timestamp: new Date().toISOString(),
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode =
            error?.status || error?.statusCode || response.statusCode || 500;

          let errorCode: string | number | undefined;
          if (error?.response) {
            const errorResponse = error.response;
            if (typeof errorResponse === 'object' && errorResponse !== null) {
              if (
                'error' in errorResponse &&
                typeof errorResponse.error === 'string'
              ) {
                errorCode = errorResponse.error;
              } else if ('code' in errorResponse) {
                errorCode = errorResponse.code;
              }
            } else if (typeof errorResponse === 'string') {
              errorCode = errorResponse;
            }
          } else if (error?.message) {
            errorCode = error.message;
          }

          this.logger.error(
            'Request failed',
            error instanceof Error
              ? error
              : new Error(error?.message || 'Unknown error'),
            {
              method,
              url,
              statusCode,
              duration: `${duration}ms`,
              errorCode: errorCode || statusCode,
              errorMessage: error?.message || 'Unknown error',
              ip,
              timestamp: new Date().toISOString(),
            },
          );
        },
      }),
    );
  }
}
