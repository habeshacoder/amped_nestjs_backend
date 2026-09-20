import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
} from '../exceptions/domain-exceptions';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = { status: mockStatus };
    mockRequest = {
      method: 'GET',
      url: '/test-endpoint',
      headers: { 'x-request-id': 'req-123' },
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    loggerWarnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should catch DomainException and format code, path, timestamp, requestId', () => {
    const exception = new NotFoundError(
      'Channel not found',
      'CHANNEL_NOT_FOUND',
    );
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        code: 'CHANNEL_NOT_FOUND',
        message: 'Channel not found',
        path: '/test-endpoint',
        requestId: 'req-123',
      }),
    );
  });

  it('should catch ConflictError and format correctly', () => {
    const exception = new ConflictError('Channel name taken');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        code: 'CONFLICT',
        message: 'Channel name taken',
      }),
    );
  });

  it('should catch ValidationError and format correctly', () => {
    const exception = new ValidationError('Invalid channel data');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: 'Invalid channel data',
      }),
    );
  });

  it('should catch ForbiddenError and format correctly', () => {
    const exception = new ForbiddenError(
      'Only the channel owner can perform this action',
    );
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        code: 'FORBIDDEN',
        message: 'Only the channel owner can perform this action',
      }),
    );
  });

  it('should catch HttpException and format the response correctly', () => {
    const exception = new HttpException(
      { message: 'Forbidden access', error: 'Forbidden' },
      HttpStatus.FORBIDDEN,
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Forbidden access',
        error: 'Forbidden',
        path: '/test-endpoint',
        requestId: 'req-123',
      }),
    );
    expect(loggerWarnSpy).toHaveBeenCalled();
  });

  it('should catch HttpException with string response', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad Request',
      }),
    );
  });

  it('should catch unhandled generic Error and return 500 status', () => {
    const error = new Error('Database crash');

    filter.catch(error, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        error: 'Error',
      }),
    );
    expect(loggerErrorSpy).toHaveBeenCalled();
  });

  it('should map Prisma P2002 unique constraint error to 409 Conflict', () => {
    const prismaError = {
      code: 'P2002',
      message: 'Unique constraint failed on the fields: (`email`)',
      meta: { target: ['email'] },
    };

    filter.catch(prismaError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        code: 'P2002',
        message: 'A record with this unique constraint already exists.',
      }),
    );
    expect(loggerWarnSpy).toHaveBeenCalled();
  });

  it('should map Prisma P2003 foreign key constraint error to 400 Bad Request', () => {
    const prismaError = {
      code: 'P2003',
      message: 'Foreign key constraint failed on the field: (`user_id`)',
    };

    filter.catch(prismaError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'P2003',
        message:
          'Foreign key constraint violated: referenced entity does not exist.',
      }),
    );
    expect(loggerWarnSpy).toHaveBeenCalled();
  });

  it('should map Prisma P2025 not found error to 404 Not Found', () => {
    const prismaError = {
      code: 'P2025',
      message:
        'An operation failed because it depends on one or more records that were required but not found.',
    };

    filter.catch(prismaError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        code: 'P2025',
        message: 'The requested database record was not found.',
      }),
    );
    expect(loggerWarnSpy).toHaveBeenCalled();
  });

  it('should map Prisma P2000 value too long error to 400 Bad Request', () => {
    const prismaError = {
      code: 'P2000',
      message:
        "The provided value for the column is too long for the column's type.",
    };

    filter.catch(prismaError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'P2000',
        message: 'Provided value exceeds maximum database field length.',
      }),
    );
    expect(loggerWarnSpy).toHaveBeenCalled();
  });

  it('should map unknown Prisma error code to 500 without leaking details', () => {
    const prismaError = {
      code: 'P9999',
      message:
        'SELECT * FROM internal_sensitive_table crashed with syntax error',
    };

    filter.catch(prismaError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'DATABASE_ERROR',
        message: 'A database error occurred.',
      }),
    );
    expect(loggerErrorSpy).toHaveBeenCalled();
  });
});
