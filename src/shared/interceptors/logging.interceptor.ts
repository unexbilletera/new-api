import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const delay = Date.now() - now;
        
        // Extrair código de sucesso/erro da resposta
        let code: string | undefined;
        if (data && typeof data === 'object') {
          if ('code' in data && typeof data.code === 'string') {
            code = data.code;
          } else if ('error' in data && typeof data.error === 'string') {
            code = data.error;
          }
        }
        
        const codeInfo = code ? ` [${code}]` : '';
        this.logger.info(`${method} ${url} ${response.statusCode} - ${delay}ms${codeInfo}`);
      }),
      catchError((error) => {
        const response = context.switchToHttp().getResponse();
        const delay = Date.now() - now;
        
        // Extrair código de erro
        let errorCode: string | undefined;
        if (error?.response) {
          const errorResponse = error.response;
          if (typeof errorResponse === 'object' && errorResponse !== null) {
            if ('error' in errorResponse && typeof errorResponse.error === 'string') {
              errorCode = errorResponse.error;
            } else if ('code' in errorResponse) {
              errorCode = String(errorResponse.code);
            }
          } else if (typeof errorResponse === 'string') {
            errorCode = errorResponse;
          }
        } else if (error?.message) {
          errorCode = error.message;
        }
        
        const statusCode = error?.status || error?.statusCode || response.statusCode || 500;
        const codeInfo = errorCode ? ` [${errorCode}]` : '';
        this.logger.info(`${method} ${url} ${statusCode} - ${delay}ms${codeInfo}`);
        
        return throwError(() => error);
      }),
    );
  }
}

