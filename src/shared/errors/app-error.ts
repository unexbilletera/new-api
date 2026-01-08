import { HttpException } from '@nestjs/common';
import { ErrorCodes, getStatusCodeFromErrorCode } from './error-codes';

export {
  ErrorCodes,
  getStatusCodeFromErrorCode,
  isErrorCode,
} from './error-codes';
export { SuccessCodes } from './success-codes';

export class AppError extends HttpException {
  constructor(
    errorCode: string | ErrorCodes,
    message?: string,
    statusCode?: number,
  ) {
    const code = typeof errorCode === 'string' ? errorCode : errorCode;
    const status = statusCode || getStatusCodeFromErrorCode(code);
    const errorMessage = message || code;

    super(
      {
        error: code,
        message: errorMessage,
        code: status,
      },
      status,
    );
  }
}

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
