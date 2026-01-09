import { applyDecorators } from '@nestjs/common';
import {
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { ApiErrorResponses } from './error-responses';

export function ApiAuthRequired() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiUnauthorizedResponse({
      ...ApiErrorResponses.Unauthorized,
    }),
  );
}

export function ApiAuthWithPermission() {
  return applyDecorators(
    ApiAuthRequired(),
    ApiForbiddenResponse({
      ...ApiErrorResponses.Forbidden,
    }),
  );
}

export function ApiCommonResponses() {
  return applyDecorators(
    ApiBadRequestResponse({
      ...ApiErrorResponses.BadRequest,
    }),
    ApiInternalServerErrorResponse({
      ...ApiErrorResponses.InternalServerError,
    }),
  );
}

export function ApiCrudResponses() {
  return applyDecorators(
    ApiCommonResponses(),
    ApiNotFoundResponse({
      ...ApiErrorResponses.NotFound,
    }),
  );
}

export function ApiConflictResponses() {
  return applyDecorators(
    ApiCommonResponses(),
    ApiConflictResponse({
      ...ApiErrorResponses.Conflict,
    }),
  );
}

export function ApiSecureCrudEndpoint() {
  return applyDecorators(
    ApiAuthWithPermission(),
    ApiCrudResponses(),
  );
}

export function ApiPublicEndpoint() {
  return applyDecorators(
    ApiCommonResponses(),
  );
}

export function ApiCreateEndpoint() {
  return applyDecorators(
    ApiCommonResponses(),
    ApiConflictResponse({
      ...ApiErrorResponses.Conflict,
    }),
  );
}

export function ApiUpdateEndpoint() {
  return applyDecorators(
    ApiCrudResponses(),
    ApiConflictResponse({
      ...ApiErrorResponses.Conflict,
    }),
  );
}

export function ApiDeleteEndpoint() {
  return applyDecorators(
    ApiCrudResponses(),
  );
}
