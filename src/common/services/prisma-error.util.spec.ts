import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { handlePrismaError } from './prisma-error.util';
import { ConflictError, NotFoundError } from '../exceptions/domain-exceptions';

describe('handlePrismaError', () => {
  it('should translate Prisma P2002 to ConflictError', () => {
    const p2002 = new PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '6.19.3',
      },
    );

    expect(() => handlePrismaError(p2002)).toThrow(ConflictError);
  });

  it('should translate Prisma P2025 to NotFoundError', () => {
    const p2025 = new PrismaClientKnownRequestError(
      'An operation failed because it depends on one or more records that were required but not found.',
      {
        code: 'P2025',
        clientVersion: '6.19.3',
      },
    );

    expect(() => handlePrismaError(p2025)).toThrow(NotFoundError);
  });

  it('should re-throw unknown Prisma code untouched', () => {
    const unknownPrismaError = new PrismaClientKnownRequestError(
      'Unknown database failure',
      {
        code: 'P2099',
        clientVersion: '6.19.3',
      },
    );

    expect(() => handlePrismaError(unknownPrismaError)).toThrow(
      unknownPrismaError,
    );
  });

  it('should re-throw existing DomainException untouched', () => {
    const notFound = new NotFoundError('Custom not found message');

    expect(() => handlePrismaError(notFound)).toThrow(notFound);
  });

  it('should re-throw generic unexpected non-Prisma error untouched', () => {
    const generic = new Error('Unexpected DB error');

    expect(() => handlePrismaError(generic)).toThrow(generic);
  });

  it('should re-throw non-Error literal primitives untouched', () => {
    expect(() => handlePrismaError('string error')).toThrow('string error');
  });
});
