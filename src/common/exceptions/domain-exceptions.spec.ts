import { HttpStatus } from '@nestjs/common';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
} from './domain-exceptions';

describe('Domain Exceptions', () => {
  it('should create NotFoundError with default values', () => {
    const error = new NotFoundError();
    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Resource not found');
  });

  it('should create ConflictError with custom values', () => {
    const error = new ConflictError('Email in use', 'EMAIL_IN_USE');
    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(error.code).toBe('EMAIL_IN_USE');
    expect(error.message).toBe('Email in use');
  });

  it('should create ValidationError with default values', () => {
    const error = new ValidationError();
    expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Validation failed');
  });

  it('should create ForbiddenError with default values', () => {
    const error = new ForbiddenError();
    expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toBe('Access forbidden');
  });
});
