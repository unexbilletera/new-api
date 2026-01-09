/**
 * Decoradores customizados para Swagger
 * Combinam múltiplos decoradores @nestjs/swagger para padrões comuns
 */

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

/**
 * Decorador para endpoints que requerem autenticação JWT
 * Adiciona:
 * - @ApiBearerAuth('JWT-auth')
 * - @ApiUnauthorizedResponse com schema detalhado
 */
export function ApiAuthRequired() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiUnauthorizedResponse({
      ...ApiErrorResponses.Unauthorized,
    }),
  );
}

/**
 * Decorador para endpoints com validação de permissões
 * Adiciona respostas para Forbidden além das respostas de autenticação
 */
export function ApiAuthWithPermission() {
  return applyDecorators(
    ApiAuthRequired(),
    ApiForbiddenResponse({
      ...ApiErrorResponses.Forbidden,
    }),
  );
}

/**
 * Decorador para endpoints que podem retornar erros comuns de validação
 * Adiciona respostas para 400, 401, 500
 */
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

/**
 * Decorador para endpoints de CRUD que retornam Not Found
 * Adiciona respostas para 404 além de comum
 */
export function ApiCrudResponses() {
  return applyDecorators(
    ApiCommonResponses(),
    ApiNotFoundResponse({
      ...ApiErrorResponses.NotFound,
    }),
  );
}

/**
 * Decorador para endpoints que podem ter conflitos (duplicatas, estado inválido)
 */
export function ApiConflictResponses() {
  return applyDecorators(
    ApiCommonResponses(),
    ApiConflictResponse({
      ...ApiErrorResponses.Conflict,
    }),
  );
}

/**
 * Decorador completo para endpoints protegidos com CRUD
 * Combina autenticação + permissão + respostas de CRUD
 */
export function ApiSecureCrudEndpoint() {
  return applyDecorators(
    ApiAuthWithPermission(),
    ApiCrudResponses(),
  );
}

/**
 * Decorador completo para endpoints públicos com validação
 * Apenas respostas de validação, sem autenticação
 */
export function ApiPublicEndpoint() {
  return applyDecorators(
    ApiCommonResponses(),
  );
}

/**
 * Decorador para endpoints que criam recursos
 * Adiciona respostas comuns + conflito (duplicata)
 */
export function ApiCreateEndpoint() {
  return applyDecorators(
    ApiCommonResponses(),
    ApiConflictResponse({
      ...ApiErrorResponses.Conflict,
    }),
  );
}

/**
 * Decorador para endpoints que atualizam recursos
 * Adiciona respostas comuns + not found + conflito
 */
export function ApiUpdateEndpoint() {
  return applyDecorators(
    ApiCrudResponses(),
    ApiConflictResponse({
      ...ApiErrorResponses.Conflict,
    }),
  );
}

/**
 * Decorador para endpoints que deletam recursos
 * Adiciona respostas comuns + not found
 */
export function ApiDeleteEndpoint() {
  return applyDecorators(
    ApiCrudResponses(),
  );
}
