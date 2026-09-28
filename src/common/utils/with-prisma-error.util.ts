import { handlePrismaError } from '../services/prisma-error.util';

/**
 * Wraps an async operation with central Prisma error handling.
 * Automatically catches known Prisma exceptions and translates them
 * to the appropriate domain exceptions (ConflictError, NotFoundError, etc.),
 * eliminating repetitive try/catch boilerplate across services.
 */
export async function withPrismaErrorHandling<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw handlePrismaError(error);
  }
}
