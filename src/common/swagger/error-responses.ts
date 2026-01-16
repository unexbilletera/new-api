export const ApiErrorResponses = {
  BadRequest: {
    status: 400,
    description: 'Invalid request - incorrect or missing parameters',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Data validation failed' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  },
  Unauthorized: {
    status: 401,
    description: 'Unauthorized - invalid credentials or expired token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  },
  Forbidden: {
    status: 403,
    description: 'Forbidden - user without permission to access this resource',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Access denied' },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  },
  NotFound: {
    status: 404,
    description: 'Resource not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Resource not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  },
  Conflict: {
    status: 409,
    description:
      'Conflict - resource already exists or data is in invalid state',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Resource already exists' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  },
  InternalServerError: {
    status: 500,
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Internal server error' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  },
};
