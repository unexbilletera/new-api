export const ApiErrorResponses = {
  BadRequest: {
    status: 400,
    description: 'Requisição inválida - parâmetros incorretos ou ausentes',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Falha na validação dos dados' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  },
  Unauthorized: {
    status: 401,
    description: 'Não autorizado - credenciais inválidas ou token expirado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Credenciais inválidas' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  },
  Forbidden: {
    status: 403,
    description: 'Proibido - usuário sem permissão para acessar este recurso',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Acesso negado' },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  },
  NotFound: {
    status: 404,
    description: 'Recurso não encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Recurso não encontrado' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  },
  Conflict: {
    status: 409,
    description: 'Conflito - recurso já existe ou dados estão em estado inválido',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Recurso já existe' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  },
  InternalServerError: {
    status: 500,
    description: 'Erro interno do servidor',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Erro interno do servidor' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  },
};
