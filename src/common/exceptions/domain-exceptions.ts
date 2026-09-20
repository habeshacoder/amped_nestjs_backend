import { HttpException, HttpStatus } from '@nestjs/common';

export abstract class DomainException extends HttpException {
  readonly code: string;

  constructor(message: string, statusCode: HttpStatus, code: string) {
    super({ statusCode, code, message }, statusCode);
    this.code = code;
  }
}

export class NotFoundError extends DomainException {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, HttpStatus.NOT_FOUND, code);
  }
}

export class ConflictError extends DomainException {
  constructor(message = 'Resource already exists', code = 'CONFLICT') {
    super(message, HttpStatus.CONFLICT, code);
  }
}

export class ValidationError extends DomainException {
  constructor(message = 'Validation failed', code = 'VALIDATION_ERROR') {
    super(message, HttpStatus.BAD_REQUEST, code);
  }
}

export class ForbiddenError extends DomainException {
  constructor(message = 'Access forbidden', code = 'FORBIDDEN') {
    super(message, HttpStatus.FORBIDDEN, code);
  }
}
