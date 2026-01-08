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

/**
 * Filtro de exceções que formata erros no padrão da API antiga
 * Formato: { error: "400 users.errors.invalidPassword", message: "400 users.errors.invalidPassword" }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode: string | undefined;
    let message: string | undefined;

    // Se for AppError (nossa exception customizada), usar diretamente
    if (exception instanceof AppError) {
      status = exception.getStatus();
      const responseData = exception.getResponse() as {
        error: string;
        message: string;
      };
      errorCode = responseData.error;
      message = responseData.message;
    }
    // Se for HttpException do NestJS
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseData = exception.getResponse();

      // Se a resposta já estiver no formato de erro da API antiga
      if (
        typeof responseData === 'object' &&
        responseData !== null &&
        'error' in responseData &&
        typeof (responseData as { error: unknown }).error === 'string'
      ) {
        const errorData = responseData as { error: string; message?: string };
        errorCode = errorData.error;
        message = errorData.message || errorData.error;

        // Se o error já estiver no formato antigo, usar diretamente
        if (isErrorCode(errorData.error)) {
          status = getStatusCodeFromErrorCode(errorData.error);
        }
      }
      // Se for string, verificar se é um código de erro no formato antigo
      else if (typeof responseData === 'string' && isErrorCode(responseData)) {
        errorCode = responseData;
        message = responseData;
        status = getStatusCodeFromErrorCode(responseData);
      }
      // Caso padrão do NestJS
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
    // Se for um Error comum do JavaScript
    else if (exception instanceof Error) {
      // Verificar se a mensagem é um código de erro no formato antigo
      if (isErrorCode(exception.message)) {
        errorCode = exception.message;
        message = exception.message;
        status = getStatusCodeFromErrorCode(exception.message);
      } else {
        errorCode = '500 server.errors.internalError';
        message = exception.message || 'Erro interno do servidor';
      }
    }
    // Erro desconhecido
    else {
      errorCode = '500 server.errors.internalError';
      message = 'Erro interno do servidor';
    }

    // Formatar resposta no padrão da API antiga
    // Sempre inclui o código de erro e o status code numérico
    response.status(status).send({
      error: errorCode,
      message: message || errorCode,
      code: status, // Status code numérico (ex: 401)
    });
  }
}
