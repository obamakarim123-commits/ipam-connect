export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message, 400, code);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Unauthorized', code: string = 'AUTH_ERROR') {
    super(message, 401, code);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN_ERROR') {
    super(message, 403, code);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, code: string = 'NOT_FOUND') {
    super(`${resource} not found`, 404, code);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: string = 'CONFLICT_ERROR') {
    super(message, 409, code);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', code: string = 'RATE_LIMIT') {
    super(message, 429, code);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export function handleError(error: any) {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
    };
  }

  console.error('Unhandled error:', error);

  return {
    statusCode: 500,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  };
}

export function createErrorResponse(error: any) {
  const errorData = handleError(error);
  return new Response(JSON.stringify(errorData), {
    status: errorData.statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
