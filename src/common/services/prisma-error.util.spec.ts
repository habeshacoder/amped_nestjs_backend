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

  it('should re-throw existing DomainException untouched', () => {
    const notFound = new NotFoundError('Custom not found message');

    expect(() => handlePrismaError(notFound)).toThrow(notFound);
  });

  it('should re-throw generic unexpected error untouched', () => {
    const generic = new Error('Unexpected DB error');

    expect(() => handlePrismaError(generic)).toThrow(generic);
  });
});
