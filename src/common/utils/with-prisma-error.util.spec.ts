import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { withPrismaErrorHandling } from './with-prisma-error.util';
import { ConflictError, NotFoundError } from '../exceptions/domain-exceptions';

describe('withPrismaErrorHandling', () => {
  it('should return the result when operation resolves successfully', async () => {
    const result = await withPrismaErrorHandling(async () => 'success_data');
    expect(result).toBe('success_data');
  });

  it('should map Prisma P2002 error to ConflictError', async () => {
    const p2002 = new PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '6.19.3',
      },
    );

    await expect(
      withPrismaErrorHandling(async () => {
        throw p2002;
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('should map Prisma P2025 error to NotFoundError', async () => {
    const p2025 = new PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '6.19.3',
    });

    await expect(
      withPrismaErrorHandling(async () => {
        throw p2025;
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should re-throw generic unexpected errors', async () => {
    const customError = new Error('Database connection failed');

    await expect(
      withPrismaErrorHandling(async () => {
        throw customError;
      }),
    ).rejects.toThrow('Database connection failed');
  });
});
