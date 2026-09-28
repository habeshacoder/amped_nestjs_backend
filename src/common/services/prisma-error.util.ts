import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  ConflictError,
  DomainException,
  NotFoundError,
} from '../exceptions/domain-exceptions';

/**
 * Centrally maps Prisma errors to domain exceptions.
 * Translates P2002 unique constraint violations to ConflictError.
 * Translates P2025 record not found to NotFoundError.
 * Preserves already instantiated DomainExceptions and bubbles unexpected errors.
 */
export function handlePrismaError(error: unknown): never {
  if (
    error instanceof PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictError('Credentials Taken', 'CREDENTIALS_TAKEN');
  }
  if (
    error instanceof PrismaClientKnownRequestError &&
    error.code === 'P2025'
  ) {
    throw new NotFoundError('Record Not Found', 'RECORD_NOT_FOUND');
  }
  if (error instanceof DomainException) {
    throw error;
  }
  throw error;
}
