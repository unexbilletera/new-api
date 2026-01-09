import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { AppError } from '../errors/app-error';
import { isErrorCode, getStatusCodeFromErrorCode } from '../errors/error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode: string | undefined;
    let message: string | undefined;

    if (exception instanceof AppError) {
      status = exception.getStatus();
      const responseData = exception.getResponse() as {
        error: string;
        message: string;
      };
      errorCode = responseData.error;
      message = responseData.message;
    }
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseData = exception.getResponse();

      if (
        typeof responseData === 'object' &&
        responseData !== null &&
        'error' in responseData &&
        typeof (responseData as { error: unknown }).error === 'string'
      ) {
        const errorData = responseData as { error: string; message?: string };
        errorCode = errorData.error;
        message = errorData.message || errorData.error;

        if (isErrorCode(errorData.error)) {
          status = getStatusCodeFromErrorCode(errorData.error);
        }
      }
      else if (typeof responseData === 'string' && isErrorCode(responseData)) {
        errorCode = responseData;
        message = responseData;
        status = getStatusCodeFromErrorCode(responseData);
      }
      else {
        message =
          typeof responseData === 'string'
            ? responseData
            : (responseData as { message?: string })?.message ||
              'Erro interno do servidor';
        const isInternalError = Number(status) === 500;
        errorCode = `500 server.errors.${isInternalError ? 'internalError' : 'unknownError'}`;
      }
    }
    else if (exception instanceof Error) {
      if (isErrorCode(exception.message)) {
        errorCode = exception.message;
        message = exception.message;
        status = getStatusCodeFromErrorCode(exception.message);
      } else {
        errorCode = '500 server.errors.internalError';
        message = exception.message || 'Erro interno do servidor';
      }
    }
    else {
      errorCode = '500 server.errors.internalError';
      message = 'Erro interno do servidor';
    }

    response.status(status).send({
      error: errorCode,
      message: message || errorCode,
      code: status,
    });
  }
}
