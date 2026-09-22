import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  ConflictError,
  DomainException,
} from '../exceptions/domain-exceptions';

/**
 * Centrally maps Prisma errors to domain exceptions.
 * Translates P2002 unique constraint violations to ConflictError.
 * Preserves already instantiated DomainExceptions and bubbles unexpected errors.
 */
export function handlePrismaError(error: unknown): never {
  if (
    error instanceof PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictError('Credentials Taken', 'CREDENTIALS_TAKEN');
  }
  if (error instanceof DomainException) {
    throw error;
  }
  throw error;
}
