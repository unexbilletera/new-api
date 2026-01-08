import { HttpException } from '@nestjs/common';
import { ErrorCodes, getStatusCodeFromErrorCode } from './error-codes';

// Re-export ErrorCodes para facilitar imports
export {
  ErrorCodes,
  getStatusCodeFromErrorCode,
  isErrorCode,
} from './error-codes';
export { SuccessCodes } from './success-codes';

/**
 * Exception customizada que segue o padrão de erro da API antiga
 * Formato: {statusCode} {modulo}.errors.{codigoErro}
 *
 * Exemplo: "400 users.errors.invalidPassword"
 */
export class AppError extends HttpException {
  constructor(
    errorCode: string | ErrorCodes,
    message?: string,
    statusCode?: number,
  ) {
    // Se for um código de erro no formato antigo, extrair o status code
    const code = typeof errorCode === 'string' ? errorCode : errorCode;
    const status = statusCode || getStatusCodeFromErrorCode(code);
    const errorMessage = message || code;

    super(
      {
        error: code,
        message: errorMessage,
        code: status, // Status code numérico (ex: 401)
      },
      status,
    );
  }
}

/**
 * Helper para criar erros de forma mais simples
 */
export class ErrorHelper {
  static badRequest(
    errorCode: string | ErrorCodes,
    message?: string,
  ): AppError {
    return new AppError(errorCode, message, 400);
  }

  static unauthorized(
    errorCode: string | ErrorCodes,
    message?: string,
  ): AppError {
    return new AppError(errorCode, message, 401);
  }

  static forbidden(errorCode: string | ErrorCodes, message?: string): AppError {
    return new AppError(errorCode, message, 403);
  }

  static notFound(errorCode: string | ErrorCodes, message?: string): AppError {
    return new AppError(errorCode, message, 404);
  }

  static internalServerError(
    errorCode: string | ErrorCodes,
    message?: string,
  ): AppError {
    return new AppError(errorCode, message, 500);
  }
}
